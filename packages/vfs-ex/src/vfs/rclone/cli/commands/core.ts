import type { Argv } from 'yargs';
import { RcloneWrapper } from '../RcloneWrapper';
import { Logger } from 'tslog';

const logger = new Logger({ name: 'CoreCommands' });

export function setupCoreCommands(yargs: Argv): void {
  
  // ls command - List the objects in the path with size and path
  yargs.command(
    'ls <remote>',
    'List the objects in the path with size and path',
    (yargs) => {
      return yargs
        .positional('remote', {
          describe: 'Remote path to list',
          type: 'string',
          demandOption: true,
        })
        .options({
          'max-age': {
            type: 'string',
            description: 'Only show objects newer than this',
          },
          'max-size': {
            type: 'string', 
            description: 'Only show objects smaller than this',
          },
          'min-size': {
            type: 'string',
            description: 'Only show objects larger than this',
          },
          'human-readable': {
            type: 'boolean',
            description: 'Print sizes in human readable format',
            alias: 'h',
          },
        });
    },
    async (argv) => {
      const wrapper = new RcloneWrapper(argv);
      
      try {
        const args = [argv.remote];
        
        if (argv.maxAge) args.push('--max-age', argv.maxAge);
        if (argv.maxSize) args.push('--max-size', argv.maxSize);
        if (argv.minSize) args.push('--min-size', argv.minSize);
        if (argv.humanReadable) args.push('-h');
        
        const result = await wrapper.executeCommand('ls', args, argv);
        
        if (!result.success) {
          logger.error('ls command failed:', result.stderr);
          process.exit(result.exitCode);
        }
      } catch (error) {
        logger.error('Error executing ls:', error);
        process.exit(1);
      }
    }
  );

  // lsd command - List all directories/containers/buckets in the path
  yargs.command(
    'lsd <remote>',
    'List all directories/containers/buckets in the path',
    (yargs) => {
      return yargs
        .positional('remote', {
          describe: 'Remote path to list directories',
          type: 'string',
          demandOption: true,
        })
        .options({
          'human-readable': {
            type: 'boolean',
            description: 'Print sizes in human readable format',
            alias: 'h',
          },
          'recursive': {
            type: 'boolean',
            description: 'Recurse into the listing',
            alias: 'R',
          },
        });
    },
    async (argv) => {
      const wrapper = new RcloneWrapper(argv);
      
      try {
        const args = [argv.remote];
        
        if (argv.humanReadable) args.push('-h');
        if (argv.recursive) args.push('-R');
        
        const result = await wrapper.executeCommand('lsd', args, argv);
        
        if (!result.success) {
          logger.error('lsd command failed:', result.stderr);
          process.exit(result.exitCode);
        }
      } catch (error) {
        logger.error('Error executing lsd:', error);
        process.exit(1);
      }
    }
  );

  // lsf command - List directories and objects in remote:path formatted for parsing
  yargs.command(
    'lsf <remote>',
    'List directories and objects in remote:path formatted for parsing',
    (yargs) => {
      return yargs
        .positional('remote', {
          describe: 'Remote path to list',
          type: 'string',
          demandOption: true,
        })
        .options({
          'format': {
            type: 'string',
            description: 'Output format string',
            default: 'p',
          },
          'separator': {
            type: 'string',
            description: 'Separator for the items',
            default: '\n',
          },
          'dir-slash': {
            type: 'boolean',
            description: 'Append a slash to directory names',
          },
          'recursive': {
            type: 'boolean',
            description: 'Recurse into the listing',
            alias: 'R',
          },
          'files-only': {
            type: 'boolean',
            description: 'Only list files',
          },
          'dirs-only': {
            type: 'boolean',
            description: 'Only list directories',
          },
        });
    },
    async (argv) => {
      const wrapper = new RcloneWrapper(argv);
      
      try {
        const args = [argv.remote];
        
        if (argv.format) args.push('--format', argv.format);
        if (argv.separator) args.push('--separator', argv.separator);
        if (argv.dirSlash) args.push('--dir-slash');
        if (argv.recursive) args.push('-R');
        if (argv.filesOnly) args.push('--files-only');
        if (argv.dirsOnly) args.push('--dirs-only');
        
        const result = await wrapper.executeCommand('lsf', args, argv);
        
        if (!result.success) {
          logger.error('lsf command failed:', result.stderr);
          process.exit(result.exitCode);
        }
      } catch (error) {
        logger.error('Error executing lsf:', error);
        process.exit(1);
      }
    }
  );

  // lsjson command - List directories and objects in the path in JSON format
  yargs.command(
    'lsjson <remote>',
    'List directories and objects in the path in JSON format',
    (yargs) => {
      return yargs
        .positional('remote', {
          describe: 'Remote path to list',
          type: 'string',
          demandOption: true,
        })
        .options({
          'recursive': {
            type: 'boolean',
            description: 'Recurse into the listing',
            alias: 'R',
          },
          'files-only': {
            type: 'boolean',
            description: 'Only list files',
          },
          'dirs-only': {
            type: 'boolean',
            description: 'Only list directories',
          },
          'hash': {
            type: 'boolean',
            description: 'Include hashes in the output',
            alias: 'M',
          },
          'no-modtime': {
            type: 'boolean',
            description: 'Don\'t read the modification time',
          },
          'no-mimetype': {
            type: 'boolean',
            description: 'Don\'t read the mime type',
          },
          'encrypted': {
            type: 'boolean',
            description: 'Show the encrypted names',
          },
          'original': {
            type: 'boolean',
            description: 'Show the ID of the underlying Object',
          },
        });
    },
    async (argv) => {
      const wrapper = new RcloneWrapper(argv);
      
      try {
        const args = [argv.remote];
        
        if (argv.recursive) args.push('-R');
        if (argv.filesOnly) args.push('--files-only');
        if (argv.dirsOnly) args.push('--dirs-only');
        if (argv.hash) args.push('-M');
        if (argv.noModtime) args.push('--no-modtime');
        if (argv.noMimetype) args.push('--no-mimetype');
        if (argv.encrypted) args.push('--encrypted');
        if (argv.original) args.push('--original');
        
        const result = await wrapper.executeCommand('lsjson', args, argv);
        
        if (!result.success) {
          logger.error('lsjson command failed:', result.stderr);
          process.exit(result.exitCode);
        }
      } catch (error) {
        logger.error('Error executing lsjson:', error);
        process.exit(1);
      }
    }
  );

  // tree command - List the contents of the remote in a tree like fashion
  yargs.command(
    'tree <remote>',
    'List the contents of the remote in a tree like fashion',
    (yargs) => {
      return yargs
        .positional('remote', {
          describe: 'Remote path to show tree',
          type: 'string',
          demandOption: true,
        })
        .options({
          'human-readable': {
            type: 'boolean',
            description: 'Print sizes in human readable format',
            alias: 'h',
          },
          'level': {
            type: 'number',
            description: 'Descend only level directories deep',
            alias: 'L',
          },
          'dirs-only': {
            type: 'boolean',
            description: 'List directories only',
            alias: 'd',
          },
          'sort': {
            type: 'string',
            description: 'Select sort: name,version,size,time (default name)',
          },
          'sort-reverse': {
            type: 'boolean',
            description: 'Reverse the sort order',
            alias: 'r',
          },
        });
    },
    async (argv) => {
      const wrapper = new RcloneWrapper(argv);
      
      try {
        const args = [argv.remote];
        
        if (argv.humanReadable) args.push('-h');
        if (argv.level) args.push('-L', argv.level.toString());
        if (argv.dirsOnly) args.push('-d');
        if (argv.sort) args.push('--sort', argv.sort);
        if (argv.sortReverse) args.push('-r');
        
        const result = await wrapper.executeCommand('tree', args, argv);
        
        if (!result.success) {
          logger.error('tree command failed:', result.stderr);
          process.exit(result.exitCode);
        }
      } catch (error) {
        logger.error('Error executing tree:', error);
        process.exit(1);
      }
    }
  );

  // size command - Prints the total size and number of objects in remote:path
  yargs.command(
    'size <remote>',
    'Prints the total size and number of objects in remote:path',
    (yargs) => {
      return yargs
        .positional('remote', {
          describe: 'Remote path to calculate size',
          type: 'string',
          demandOption: true,
        })
        .options({
          'json': {
            type: 'boolean',
            description: 'Format output as JSON',
          },
        });
    },
    async (argv) => {
      const wrapper = new RcloneWrapper(argv);
      
      try {
        const args = [argv.remote];
        
        if (argv.json) args.push('--json');
        
        const result = await wrapper.executeCommand('size', args, argv);
        
        if (!result.success) {
          logger.error('size command failed:', result.stderr);
          process.exit(result.exitCode);
        }
      } catch (error) {
        logger.error('Error executing size:', error);
        process.exit(1);
      }
    }
  );

  // about command - Get quota information from the remote
  yargs.command(
    'about <remote>',
    'Get quota information from the remote',
    (yargs) => {
      return yargs
        .positional('remote', {
          describe: 'Remote to get quota information',
          type: 'string',
          demandOption: true,
        })
        .options({
          'json': {
            type: 'boolean',
            description: 'Format output as JSON',
          },
          'full': {
            type: 'boolean',
            description: 'Full numbers instead of human readable',
          },
        });
    },
    async (argv) => {
      const wrapper = new RcloneWrapper(argv);
      
      try {
        const args = [argv.remote];
        
        if (argv.json) args.push('--json');
        if (argv.full) args.push('--full');
        
        const result = await wrapper.executeCommand('about', args, argv);
        
        if (!result.success) {
          logger.error('about command failed:', result.stderr);
          process.exit(result.exitCode);
        }
      } catch (error) {
        logger.error('Error executing about:', error);
        process.exit(1);
      }
    }
  );

  // cat command - Concatenates any files and sends them to stdout
  yargs.command(
    'cat <remote>',
    'Concatenates any files and sends them to stdout',
    (yargs) => {
      return yargs
        .positional('remote', {
          describe: 'Remote file(s) to concatenate',
          type: 'string',
          demandOption: true,
        })
        .options({
          'head': {
            type: 'number',
            description: 'Only print the first N lines',
          },
          'tail': {
            type: 'number',
            description: 'Only print the last N lines',
          },
          'offset': {
            type: 'string',
            description: 'Start printing at offset N',
          },
          'count': {
            type: 'string',
            description: 'Only print N characters',
          },
          'discard': {
            type: 'boolean',
            description: 'Discard the output instead of printing',
          },
        });
    },
    async (argv) => {
      const wrapper = new RcloneWrapper(argv);
      
      try {
        const args = [argv.remote];
        
        if (argv.head) args.push('--head', argv.head.toString());
        if (argv.tail) args.push('--tail', argv.tail.toString());
        if (argv.offset) args.push('--offset', argv.offset);
        if (argv.count) args.push('--count', argv.count);
        if (argv.discard) args.push('--discard');
        
        const result = await wrapper.executeCommand('cat', args, argv);
        
        if (!result.success) {
          logger.error('cat command failed:', result.stderr);
          process.exit(result.exitCode);
        }
      } catch (error) {
        logger.error('Error executing cat:', error);
        process.exit(1);
      }
    }
  );
}
