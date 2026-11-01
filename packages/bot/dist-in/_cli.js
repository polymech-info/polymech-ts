export const defaults = () => {
    const DefaultCommand = 'info';
    if (process.argv.length === 2) {
        process.argv.push(DefaultCommand);
    }
    process.on('unhandledRejection', (reason) => {
        console.error('Unhandled rejection, reason: ', reason);
    });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX2NsaS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9fY2xpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUtBLE1BQU0sQ0FBQyxNQUFNLFFBQVEsR0FBRyxHQUFHLEVBQUU7SUFDekIsTUFBTSxjQUFjLEdBQUcsTUFBTSxDQUFDO0lBQzlCLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7UUFDNUIsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7SUFDdEMsQ0FBQztJQUNELE9BQU8sQ0FBQyxFQUFFLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxNQUFjLEVBQUUsRUFBRTtRQUNoRCxPQUFPLENBQUMsS0FBSyxDQUFDLCtCQUErQixFQUFFLE1BQU0sQ0FBQyxDQUFBO0lBQzFELENBQUMsQ0FBQyxDQUFBO0FBQ04sQ0FBQyxDQUFBIn0=