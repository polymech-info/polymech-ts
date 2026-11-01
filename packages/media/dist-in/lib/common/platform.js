import { platform, arch } from 'os';
export const os = () => {
    if (platform() === 'win32') {
        return 'windows';
    }
    else if (platform() === 'darwin') {
        return 'osx';
    }
    else if (arch() === 'arm') {
        return 'arm';
    }
    return 'linux';
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGxhdGZvcm0uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL2NvbW1vbi9wbGF0Zm9ybS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxNQUFNLElBQUksQ0FBQztBQUVwQyxNQUFNLENBQUMsTUFBTSxFQUFFLEdBQUcsR0FBRyxFQUFFO0lBQ3JCLElBQUksUUFBUSxFQUFFLEtBQUssT0FBTyxFQUFFLENBQUM7UUFDM0IsT0FBTyxTQUFTLENBQUM7SUFDbkIsQ0FBQztTQUFNLElBQUksUUFBUSxFQUFFLEtBQUssUUFBUSxFQUFFLENBQUM7UUFDbkMsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO1NBQU0sSUFBSSxJQUFJLEVBQUUsS0FBSyxLQUFLLEVBQUUsQ0FBQztRQUM1QixPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7SUFDRCxPQUFPLE9BQU8sQ0FBQztBQUNqQixDQUFDLENBQUEifQ==