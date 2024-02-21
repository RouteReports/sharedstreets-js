import { Args, Command, Flags } from '@oclif/core'
import { readFileSync, writeFileSync } from 'fs';
import * as turfHelpers from '@turf/helpers';

import { TilePathParams, TileType, TilePathGroup } from '../index'
import { TileIndex } from '../index'

const chalk = require('chalk');

export default class Locate extends Command {
  static description = 'returns a geospatial location given a shst reference and offset'

  static examples = [
    ``,
  ]

  static flags = {
    help: Flags.help({char: 'h'}),
    out: Flags.string({char: 'o', description: 'output file'}),
    'tile-source': Flags.string({description: 'SharedStreets tile source', default: 'osm/planet-181224'}),
    'tile-hierarchy': Flags.integer({description: 'SharedStreets tile hierarchy', default: 6}),
  }

  static args = {
    inFile: Args.string({name: 'JSON data file', required: true})
  }

  async run() {
    const {args, flags} = await this.parse(Locate)

    const inFile = args.inFile;
    const content = readFileSync(inFile);
    const data:turfHelpers.FeatureCollection<turfHelpers.Geometry> = JSON.parse(content.toLocaleString());

    var outFile = flags.out;

    if(!outFile) 
      outFile = inFile;

    if(outFile.toLocaleLowerCase().endsWith(".geojson"))
      outFile = outFile.split(".").slice(0, -1).join(".");

    this.log(chalk.bold.keyword('green')('  🗄️  Loading SharedStreets tiles...'));

    var params = new TilePathParams();
    params.source = flags['tile-source'];
    params.tileHierarchy = flags['tile-hierarchy']

    // Iterate through the items and build a set of all relevant tile ids
    var tileIds: Set<string> = new Set();
    for (var feature of data.features) {
      for (var tileId of feature.properties.shst_tile_ids) {
        tileIds.add(tileId);
      }
    }

    // Load the tiles and index them
    var tilePathGroup = new TilePathGroup();
    tilePathGroup.setParams(params);
    tilePathGroup.tileIds = Array.from(tileIds);
    tilePathGroup.tileTypes = [TileType.GEOMETRY, TileType.REFERENCE];

    var tileIndex = new TileIndex();

    await tileIndex.indexTilesByPathGroup(tilePathGroup);

    this.log(chalk.bold.keyword('green')(`  🔍  Searching data...`));

    for (var feature of data.features) {
      const ref = feature.properties.shst_ref;
      const offset = feature.properties.shst_offset;
      const geom = await tileIndex.geom(ref, offset, null);
      feature.geometry = geom.geometry;
    }

    console.log(chalk.bold.keyword('blue')('  ✏️  Writing output to: ' + outFile + '.out.geojson'));
    var jsonOut = JSON.stringify(data);
    writeFileSync(outFile + '.out.geojson', jsonOut);
  }
}
