import { crawler } from './crawlerBazar.js';
import * as path from 'path';
import { sync as exists } from '@polymech/fs/exists';
import { sync as dir } from '@polymech/fs/dir';
import { sync as rm } from '@polymech/fs/remove';
import pMap from 'p-map';
import { resolve } from '@polymech/commons';
import { bazar_root_path } from './lib.js';
const defaultOptions = (yargs) => {
    return yargs.option('dst', {
        default: bazar_root_path(),
        describe: 'The dst directory'
    }).option('debug', {
        default: 'false',
        describe: 'Enable internal debug message'
    }).option('hq', {
        default: true,
        describe: 'Download high res images'
    });
};
let options = (yargs) => defaultOptions(yargs);
// #node .\dist\main.js bazar-download --dst="../pp-bazar/2023"
export const register = (cli) => {
    return cli.command('bazar-download', '', options, async (argv) => {
        if (argv.help) {
            return;
        }
        process.env['APIFY_LOCAL_STORAGE_DIR'] = '.';
        rm(path.resolve('./request_queues'));
        const args = argv;
        const dst = path.resolve(resolve(args.dst));
        if (!exists(dst)) {
            dir(dst);
        }
        console.log('download to ' + dst);
        let mapDebug = [
            {
                url: 'https://bazar.preciousplastic.com/machines/shredder/shredder-parts/',
                prefix: 'machines/shredder/shredder-parts'
            }
        ];
        const mapShredders = [
            {
                url: 'https://bazar.preciousplastic.com/machines/shredder/shredder-parts/',
                prefix: 'machines/shredder/shredder-parts'
            },
            {
                url: 'https://bazar.preciousplastic.com/machines/shredder/shredder-kits/',
                prefix: 'machines/shredder/shredder-kits'
            },
            {
                url: 'https://bazar.preciousplastic.com/machines/shredder/shredder-fully-built/',
                prefix: 'machines/shredder/shredder-fully-built'
            },
            {
                url: 'https://bazar.preciousplastic.com/machines/shredder-pro/shredder-pro-parts/',
                prefix: 'machines/shredder-pro/shredder-pro-parts/'
            },
            {
                url: 'https://bazar.preciousplastic.com/machines/shredder-pro/shredder-pro-kits/',
                prefix: 'machines/shredder-pro/shredder-kits'
            },
            {
                url: 'https://bazar.preciousplastic.com/machines/shredder-pro/shredder-pro-fully-built/',
                prefix: 'machines/shredder-pro/shredder-fully-built'
            }
        ];
        const mapProducts = [
            {
                url: 'https://bazar.preciousplastic.com/products/household/',
                prefix: 'products/household'
            },
            {
                url: 'https://bazar.preciousplastic.com/products/furniture/',
                prefix: 'products/funiture'
            },
            {
                url: 'https://bazar.preciousplastic.com/products/art-pieces/',
                prefix: 'products/art'
            },
            {
                url: 'https://bazar.preciousplastic.com/products/lightning/',
                prefix: 'products/lighting'
            },
            {
                url: 'https://bazar.preciousplastic.com/products/accessories/',
                prefix: 'products/accessories'
            },
            {
                url: 'https://bazar.preciousplastic.com/products/other/',
                prefix: 'products/other'
            }
        ];
        const mapInjection = [
            {
                url: 'https://bazar.preciousplastic.com/machines/injection/injection-parts/',
                prefix: 'machines/injection/parts'
            },
            {
                url: 'https://bazar.preciousplastic.com/machines/injection/injection-kits/',
                prefix: 'machines/injection/kits'
            },
            {
                url: 'https://bazar.preciousplastic.com/machines/injection/injection-fully-built/',
                prefix: 'machines/injection/built'
            }
        ];
        const mapMaterial = [
            {
                url: 'https://bazar.preciousplastic.com/raw-material/plastic/',
                prefix: 'machines/material/plastic'
            },
            {
                url: 'https://bazar.preciousplastic.com/raw-material/beams/',
                prefix: 'products/beams'
            },
            {
                url: 'https://bazar.preciousplastic.com/raw-material/sheets/',
                prefix: 'products/sheets'
            }
        ];
        const mapMoulds = [
            {
                url: 'https://bazar.preciousplastic.com/moulds/injection-moulds/',
                prefix: 'moulds/injection'
            },
            {
                url: 'https://bazar.preciousplastic.com/moulds/compression-moulds/',
                prefix: 'moulds/compression'
            },
            {
                url: 'https://bazar.preciousplastic.com/moulds/extruder-moulds/',
                prefix: 'moulds/extruder'
            },
        ];
        const mapExtruders = [
            {
                url: 'https://bazar.preciousplastic.com/machines/extruder/extruder-parts/',
                prefix: 'machines/extruder-parts'
            },
            {
                url: 'https://bazar.preciousplastic.com/machines/extruder/extruder-kits/',
                prefix: 'machines/extruder-kits'
            },
            {
                url: 'https://bazar.preciousplastic.com/machines/extruder/extruder-fully-built/',
                prefix: 'machines/extruder-fully-built'
            },
        ];
        const mapExtrudersPro = [
            {
                url: 'https://bazar.preciousplastic.com/machines/extruder-pro-/extruder-pro-parts/',
                prefix: 'machines/extruder-parts-pro'
            },
            {
                url: 'https://bazar.preciousplastic.com/machines/extruder-pro/extruder-pro-kits/',
                prefix: 'machines/extruder-kits-pro'
            },
            {
                url: 'https://bazar.preciousplastic.com/machines/extruder-pro/extruder-pro-fully-built/',
                prefix: 'machines/extruder-fully-built-pro'
            },
        ];
        const mapSheetpress = [
            {
                url: 'https://bazar.preciousplastic.com/machines/sheetpress/sheet-press-fully-built/',
                prefix: 'machines/sheet-press-fully-built'
            },
            {
                url: 'https://bazar.preciousplastic.com/machines/sheetpress/sheet-press-parts/',
                prefix: 'machines/sheetpress-parts'
            }, {
                url: 'https://bazar.preciousplastic.com/machines/sheetpress/sheet-press-kits/',
                prefix: 'machines/sheetpress-kits'
            },
        ];
        const all = [
            ...mapShredders,
            ...mapProducts,
            ...mapInjection,
            ...mapMaterial,
            ...mapSheetpress,
            ...mapMoulds,
            ...mapExtruders,
            ...mapExtrudersPro
        ];
        await pMap(all, async (i) => {
            return crawler(i.url, dst, i.prefix, {
                hq: args.hq
            });
        }, { concurrency: 1 });
    });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG93bmxvYWRCYXphci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21tYW5kcy9iYXphci9kb3dubG9hZEJhemFyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQztBQUM1QyxPQUFPLEtBQUssSUFBSSxNQUFNLE1BQU0sQ0FBQztBQUM3QixPQUFPLEVBQUUsSUFBSSxJQUFJLE1BQU0sRUFBRSxNQUFNLHFCQUFxQixDQUFDO0FBQ3JELE9BQU8sRUFBRSxJQUFJLElBQUksR0FBRyxFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFDL0MsT0FBTyxFQUFFLElBQUksSUFBSSxFQUFFLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQztBQUVqRCxPQUFPLElBQUksTUFBTSxPQUFPLENBQUE7QUFDeEIsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLG1CQUFtQixDQUFBO0FBRTNDLE9BQU8sRUFDSCxlQUFlLEVBQ2xCLE1BQU0sVUFBVSxDQUFBO0FBRWpCLE1BQU0sY0FBYyxHQUFHLENBQUMsS0FBZSxFQUFFLEVBQUU7SUFDdkMsT0FBTyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRTtRQUN2QixPQUFPLEVBQUUsZUFBZSxFQUFFO1FBQzFCLFFBQVEsRUFBRSxtQkFBbUI7S0FDaEMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUU7UUFDZixPQUFPLEVBQUUsT0FBTztRQUNoQixRQUFRLEVBQUUsK0JBQStCO0tBQzVDLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFO1FBQ1osT0FBTyxFQUFFLElBQUk7UUFDYixRQUFRLEVBQUUsMEJBQTBCO0tBQ3ZDLENBQUMsQ0FBQTtBQUNOLENBQUMsQ0FBQztBQUVGLElBQUksT0FBTyxHQUFHLENBQUMsS0FBZSxFQUFFLEVBQUUsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7QUFFekQsK0RBQStEO0FBRS9ELE1BQU0sQ0FBQyxNQUFNLFFBQVEsR0FBRyxDQUFDLEdBQWEsRUFBRSxFQUFFO0lBQ3RDLE9BQU8sR0FBRyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxJQUFtQixFQUFFLEVBQUU7UUFDNUUsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFBQyxPQUFPO1FBQUMsQ0FBQztRQUMxQixPQUFPLENBQUMsR0FBRyxDQUFDLHlCQUF5QixDQUFDLEdBQUcsR0FBRyxDQUFBO1FBQzVDLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQTtRQUNwQyxNQUFNLElBQUksR0FBRyxJQUFXLENBQUE7UUFDeEIsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUE7UUFDM0MsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ2YsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBQ1osQ0FBQztRQUNELE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxHQUFHLEdBQUcsQ0FBQyxDQUFBO1FBQ2pDLElBQUksUUFBUSxHQUFHO1lBQ1g7Z0JBQ0ksR0FBRyxFQUFFLHFFQUFxRTtnQkFDMUUsTUFBTSxFQUFFLGtDQUFrQzthQUM3QztTQUNKLENBQUE7UUFFRCxNQUFNLFlBQVksR0FBRztZQUNqQjtnQkFDSSxHQUFHLEVBQUUscUVBQXFFO2dCQUMxRSxNQUFNLEVBQUUsa0NBQWtDO2FBQzdDO1lBQ0Q7Z0JBQ0ksR0FBRyxFQUFFLG9FQUFvRTtnQkFDekUsTUFBTSxFQUFFLGlDQUFpQzthQUM1QztZQUNEO2dCQUNJLEdBQUcsRUFBRSwyRUFBMkU7Z0JBQ2hGLE1BQU0sRUFBRSx3Q0FBd0M7YUFDbkQ7WUFFRDtnQkFDSSxHQUFHLEVBQUUsNkVBQTZFO2dCQUNsRixNQUFNLEVBQUUsMkNBQTJDO2FBQ3REO1lBQ0Q7Z0JBQ0ksR0FBRyxFQUFFLDRFQUE0RTtnQkFDakYsTUFBTSxFQUFFLHFDQUFxQzthQUNoRDtZQUNEO2dCQUNJLEdBQUcsRUFBRSxtRkFBbUY7Z0JBQ3hGLE1BQU0sRUFBRSw0Q0FBNEM7YUFDdkQ7U0FDSixDQUFBO1FBRUQsTUFBTSxXQUFXLEdBQUc7WUFDaEI7Z0JBQ0ksR0FBRyxFQUFFLHVEQUF1RDtnQkFDNUQsTUFBTSxFQUFFLG9CQUFvQjthQUMvQjtZQUNEO2dCQUNJLEdBQUcsRUFBRSx1REFBdUQ7Z0JBQzVELE1BQU0sRUFBRSxtQkFBbUI7YUFDOUI7WUFDRDtnQkFDSSxHQUFHLEVBQUUsd0RBQXdEO2dCQUM3RCxNQUFNLEVBQUUsY0FBYzthQUN6QjtZQUNEO2dCQUNJLEdBQUcsRUFBRSx1REFBdUQ7Z0JBQzVELE1BQU0sRUFBRSxtQkFBbUI7YUFDOUI7WUFDRDtnQkFDSSxHQUFHLEVBQUUseURBQXlEO2dCQUM5RCxNQUFNLEVBQUUsc0JBQXNCO2FBQ2pDO1lBQ0Q7Z0JBQ0ksR0FBRyxFQUFFLG1EQUFtRDtnQkFDeEQsTUFBTSxFQUFFLGdCQUFnQjthQUMzQjtTQUFDLENBQUM7UUFFUCxNQUFNLFlBQVksR0FBRztZQUNqQjtnQkFDSSxHQUFHLEVBQUUsdUVBQXVFO2dCQUM1RSxNQUFNLEVBQUUsMEJBQTBCO2FBQ3JDO1lBQ0Q7Z0JBQ0ksR0FBRyxFQUFFLHNFQUFzRTtnQkFDM0UsTUFBTSxFQUFFLHlCQUF5QjthQUNwQztZQUNEO2dCQUNJLEdBQUcsRUFBRSw2RUFBNkU7Z0JBQ2xGLE1BQU0sRUFBRSwwQkFBMEI7YUFDckM7U0FDSixDQUFDO1FBRUYsTUFBTSxXQUFXLEdBQUc7WUFDaEI7Z0JBQ0ksR0FBRyxFQUFFLHlEQUF5RDtnQkFDOUQsTUFBTSxFQUFFLDJCQUEyQjthQUN0QztZQUNEO2dCQUNJLEdBQUcsRUFBRSx1REFBdUQ7Z0JBQzVELE1BQU0sRUFBRSxnQkFBZ0I7YUFDM0I7WUFDRDtnQkFDSSxHQUFHLEVBQUUsd0RBQXdEO2dCQUM3RCxNQUFNLEVBQUUsaUJBQWlCO2FBQzVCO1NBQ0osQ0FBQztRQUdGLE1BQU0sU0FBUyxHQUFHO1lBQ2Q7Z0JBQ0ksR0FBRyxFQUFFLDREQUE0RDtnQkFDakUsTUFBTSxFQUFFLGtCQUFrQjthQUM3QjtZQUNEO2dCQUNJLEdBQUcsRUFBRSw4REFBOEQ7Z0JBQ25FLE1BQU0sRUFBRSxvQkFBb0I7YUFDL0I7WUFDRDtnQkFDSSxHQUFHLEVBQUUsMkRBQTJEO2dCQUNoRSxNQUFNLEVBQUUsaUJBQWlCO2FBQzVCO1NBQ0osQ0FBQTtRQUVELE1BQU0sWUFBWSxHQUFHO1lBQ2pCO2dCQUNJLEdBQUcsRUFBRSxxRUFBcUU7Z0JBQzFFLE1BQU0sRUFBRSx5QkFBeUI7YUFDcEM7WUFDRDtnQkFDSSxHQUFHLEVBQUUsb0VBQW9FO2dCQUN6RSxNQUFNLEVBQUUsd0JBQXdCO2FBQ25DO1lBQ0Q7Z0JBQ0ksR0FBRyxFQUFFLDJFQUEyRTtnQkFDaEYsTUFBTSxFQUFFLCtCQUErQjthQUMxQztTQUNKLENBQUE7UUFFRCxNQUFNLGVBQWUsR0FBRztZQUNoQjtnQkFDSSxHQUFHLEVBQUUsOEVBQThFO2dCQUNuRixNQUFNLEVBQUUsNkJBQTZCO2FBQ3hDO1lBQ0Q7Z0JBQ0ksR0FBRyxFQUFFLDRFQUE0RTtnQkFDakYsTUFBTSxFQUFFLDRCQUE0QjthQUN2QztZQUNEO2dCQUNJLEdBQUcsRUFBRSxtRkFBbUY7Z0JBQ3hGLE1BQU0sRUFBRSxtQ0FBbUM7YUFDOUM7U0FDUixDQUFBO1FBQ0QsTUFBTSxhQUFhLEdBQUc7WUFDbEI7Z0JBQ0ksR0FBRyxFQUFFLGdGQUFnRjtnQkFDckYsTUFBTSxFQUFFLGtDQUFrQzthQUM3QztZQUNEO2dCQUNJLEdBQUcsRUFBRSwwRUFBMEU7Z0JBQy9FLE1BQU0sRUFBRSwyQkFBMkI7YUFDdEMsRUFBRTtnQkFDQyxHQUFHLEVBQUUseUVBQXlFO2dCQUM5RSxNQUFNLEVBQUUsMEJBQTBCO2FBQ3JDO1NBR0osQ0FBQTtRQUVELE1BQU0sR0FBRyxHQUFHO1lBQ1IsR0FBRyxZQUFZO1lBQ2YsR0FBRyxXQUFXO1lBQ2QsR0FBRyxZQUFZO1lBQ2YsR0FBRyxXQUFXO1lBQ2QsR0FBRyxhQUFhO1lBQ2hCLEdBQUcsU0FBUztZQUNaLEdBQUcsWUFBWTtZQUNmLEdBQUcsZUFBZTtTQUNyQixDQUFBO1FBRUQsTUFBTSxJQUFJLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxDQUFNLEVBQUUsRUFBRTtZQUM3QixPQUFPLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsTUFBTSxFQUFDO2dCQUNoQyxFQUFFLEVBQUUsSUFBSSxDQUFDLEVBQUU7YUFDZCxDQUFDLENBQUM7UUFDUCxDQUFDLEVBQUUsRUFBRSxXQUFXLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUMzQixDQUFDLENBQUMsQ0FBQztBQUNQLENBQUMsQ0FBQyJ9