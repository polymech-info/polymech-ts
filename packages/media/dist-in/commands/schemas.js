import { cli } from '../cli.js';
import { schemas as resizeSchemas, types as resizeTypes } from '../lib/media/images/resize.js';
import { schemas as pdf2jpgSchemas, types as pdf2jpgTypes } from '../lib/pdf/convert.js';
import { schemas as watermarkSchemas, types as watermarkTypes } from '../lib/media/images/watermark.js';
import { schemas as backgroundRemoveSchemas, types as backgroundRemoveTypes } from '../lib/media/images/background-remove.js';
import { schemas as backgroundRemoveBriaSchemas, types as backgroundRemoveBriaTypes } from '../lib/media/images/background-remove-bria.js';
import { schemas as cropForegroundSchemas, types as cropForegroundTypes } from '../lib/media/images/crop-foreground.js';
export const command = 'schemas';
export const desc = 'Generate schema files (schemas.json and schema_ui.json)';
export const builder = (yargs) => {
    return yargs.option('types', {
        describe: 'Also generate TypeScript types',
        type: 'boolean',
        default: false
    });
};
export async function handler(argv) {
    console.log('Generating schemas...');
    // Generate resize schemas
    resizeSchemas();
    console.log('✓ Generated resize schemas');
    // Generate pdf2jpg schemas
    pdf2jpgSchemas();
    console.log('✓ Generated pdf2jpg schemas');
    // Generate watermark schemas
    watermarkSchemas();
    console.log('✓ Generated watermark schemas');
    // Generate background-remove schemas
    backgroundRemoveSchemas();
    console.log('✓ Generated background-remove schemas');
    // Generate background-remove-bria schemas
    backgroundRemoveBriaSchemas();
    console.log('✓ Generated background-remove-bria schemas');
    // Generate crop-foreground schemas
    cropForegroundSchemas();
    console.log('✓ Generated crop-foreground schemas');
    if (argv.types) {
        resizeTypes();
        pdf2jpgTypes();
        watermarkTypes();
        backgroundRemoveTypes();
        backgroundRemoveBriaTypes();
        cropForegroundTypes();
        console.log('✓ Generated TypeScript types');
    }
    console.log('Schema generation complete!');
}
cli.command(command, desc, builder, handler);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZW1hcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb21tYW5kcy9zY2hlbWFzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxHQUFHLEVBQUUsTUFBTSxXQUFXLENBQUE7QUFDL0IsT0FBTyxFQUFFLE9BQU8sSUFBSSxhQUFhLEVBQUUsS0FBSyxJQUFJLFdBQVcsRUFBRSxNQUFNLCtCQUErQixDQUFBO0FBQzlGLE9BQU8sRUFBRSxPQUFPLElBQUksY0FBYyxFQUFFLEtBQUssSUFBSSxZQUFZLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQTtBQUN4RixPQUFPLEVBQUUsT0FBTyxJQUFJLGdCQUFnQixFQUFFLEtBQUssSUFBSSxjQUFjLEVBQUUsTUFBTSxrQ0FBa0MsQ0FBQTtBQUN2RyxPQUFPLEVBQUUsT0FBTyxJQUFJLHVCQUF1QixFQUFFLEtBQUssSUFBSSxxQkFBcUIsRUFBRSxNQUFNLDBDQUEwQyxDQUFBO0FBQzdILE9BQU8sRUFBRSxPQUFPLElBQUksMkJBQTJCLEVBQUUsS0FBSyxJQUFJLHlCQUF5QixFQUFFLE1BQU0sK0NBQStDLENBQUE7QUFDMUksT0FBTyxFQUFFLE9BQU8sSUFBSSxxQkFBcUIsRUFBRSxLQUFLLElBQUksbUJBQW1CLEVBQUUsTUFBTSx3Q0FBd0MsQ0FBQTtBQUV2SCxNQUFNLENBQUMsTUFBTSxPQUFPLEdBQUcsU0FBUyxDQUFBO0FBQ2hDLE1BQU0sQ0FBQyxNQUFNLElBQUksR0FBRyx5REFBeUQsQ0FBQTtBQUM3RSxNQUFNLENBQUMsTUFBTSxPQUFPLEdBQUcsQ0FBQyxLQUFlLEVBQUUsRUFBRTtJQUN2QyxPQUFPLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFO1FBQ3pCLFFBQVEsRUFBRSxnQ0FBZ0M7UUFDMUMsSUFBSSxFQUFFLFNBQVM7UUFDZixPQUFPLEVBQUUsS0FBSztLQUNqQixDQUFDLENBQUE7QUFDTixDQUFDLENBQUE7QUFFRCxNQUFNLENBQUMsS0FBSyxVQUFVLE9BQU8sQ0FBQyxJQUFtQjtJQUM3QyxPQUFPLENBQUMsR0FBRyxDQUFDLHVCQUF1QixDQUFDLENBQUE7SUFFcEMsMEJBQTBCO0lBQzFCLGFBQWEsRUFBRSxDQUFBO0lBQ2YsT0FBTyxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFBO0lBRXpDLDJCQUEyQjtJQUMzQixjQUFjLEVBQUUsQ0FBQTtJQUNoQixPQUFPLENBQUMsR0FBRyxDQUFDLDZCQUE2QixDQUFDLENBQUE7SUFFMUMsNkJBQTZCO0lBQzdCLGdCQUFnQixFQUFFLENBQUE7SUFDbEIsT0FBTyxDQUFDLEdBQUcsQ0FBQywrQkFBK0IsQ0FBQyxDQUFBO0lBRTVDLHFDQUFxQztJQUNyQyx1QkFBdUIsRUFBRSxDQUFBO0lBQ3pCLE9BQU8sQ0FBQyxHQUFHLENBQUMsdUNBQXVDLENBQUMsQ0FBQTtJQUVwRCwwQ0FBMEM7SUFDMUMsMkJBQTJCLEVBQUUsQ0FBQTtJQUM3QixPQUFPLENBQUMsR0FBRyxDQUFDLDRDQUE0QyxDQUFDLENBQUE7SUFFekQsbUNBQW1DO0lBQ25DLHFCQUFxQixFQUFFLENBQUE7SUFDdkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFBO0lBRWxELElBQUksSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2IsV0FBVyxFQUFFLENBQUE7UUFDYixZQUFZLEVBQUUsQ0FBQTtRQUNkLGNBQWMsRUFBRSxDQUFBO1FBQ2hCLHFCQUFxQixFQUFFLENBQUE7UUFDdkIseUJBQXlCLEVBQUUsQ0FBQTtRQUMzQixtQkFBbUIsRUFBRSxDQUFBO1FBQ3JCLE9BQU8sQ0FBQyxHQUFHLENBQUMsOEJBQThCLENBQUMsQ0FBQTtJQUMvQyxDQUFDO0lBRUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyw2QkFBNkIsQ0FBQyxDQUFBO0FBQzlDLENBQUM7QUFFRCxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFBIn0=