import { Args, Command, Flags } from '@oclif/core'
import { readFileSync, writeFileSync } from 'fs';

import { TilePathParams, TileType, TilePathGroup } from '../index'
import { TileIndex } from '../index'
import { getTilesForId } from '../tiles';

import geomLength from '@turf/length';

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
    'ref': Flags.string({description: 'SharedStreets reference', required: true}),
    'offset': Flags.string({description: "SharedStreets offset", required: true}),
    'tile-ids': Flags.string({description: "SharedStreets tile ids as JSON list", required: true})
  }

  static args = {
  }

  async run() {
    const {args, flags} = await this.parse(Locate)

    var outFile = flags.out;

    this.log(chalk.bold.keyword('green')('  🗄️  Loading SharedStreets tiles...'));
    const tileIds = JSON.parse(flags['tile-ids']);

    var params = new TilePathParams();
    params.source = flags['tile-source'];
    params.tileHierarchy = flags['tile-hierarchy']

    var tilePathGroup = new TilePathGroup();
    tilePathGroup.setParams(params);
    tilePathGroup.tileIds = tileIds;
    tilePathGroup.tileTypes = [TileType.GEOMETRY, TileType.REFERENCE];

    var tileIndex = new TileIndex();

    await tileIndex.indexTilesByPathGroup(tilePathGroup);

    const ref = flags['ref'];
    const offset = parseFloat(flags['offset']);

    this.log(chalk.bold.keyword('green')(`  🔍  Searching data for ref=${ref} and offset=${offset}...`));

    const loc = await tileIndex.geom(ref, offset, null);

    if (outFile) {
      console.log(chalk.bold.keyword('blue')('  ✏️  Writing output to: ' + outFile + '.out.geojson'));
      var jsonOut = JSON.stringify(loc);
      writeFileSync(outFile + '.out.geojson', jsonOut);
    }

    this.log(chalk.bold.keyword('blue')(`  🗺️  Located point:\n${JSON.stringify(loc, null, 4)}`));

  }
}
