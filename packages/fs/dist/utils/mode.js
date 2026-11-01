// Converts mode to string 3 characters long.
export const normalizeFileMode = (mode) => {
    let modeAsString;
    if (typeof mode === 'number') {
        modeAsString = mode.toString(8);
    }
    else {
        modeAsString = mode;
    }
    return modeAsString.substring(modeAsString.length - 3);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9tb2RlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDZDQUE2QztBQUM3QyxNQUFNLENBQUMsTUFBTSxpQkFBaUIsR0FBRyxDQUFDLElBQXFCLEVBQVUsRUFBRTtJQUNsRSxJQUFJLFlBQW9CLENBQUM7SUFDekIsSUFBSSxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUUsQ0FBQztRQUM5QixZQUFZLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNqQyxDQUFDO1NBQU0sQ0FBQztRQUNQLFlBQVksR0FBRyxJQUFJLENBQUM7SUFDckIsQ0FBQztJQUNELE9BQU8sWUFBWSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ3hELENBQUMsQ0FBQyJ9