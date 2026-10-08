#!/usr/bin/env bun

import { runCli } from './cli/runCli';

const exitCode = await runCli(process.argv);
process.exit(exitCode);
