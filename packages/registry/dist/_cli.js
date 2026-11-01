// tweaks and handlers
export const defaults = () => {
    // default command
    const DefaultCommand = 'info';
    if (process.argv.length === 2) {
        process.argv.push(DefaultCommand);
    }
    // currently no default handler, display only :
    process.on('unhandledRejection', (reason) => {
        console.error('Unhandled rejection, reason: ', reason);
    });
};
export const sanitize = (argv) => {
    return argv;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX2NsaS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9fY2xpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBLHNCQUFzQjtBQUN0QixNQUFNLENBQUMsTUFBTSxRQUFRLEdBQUcsR0FBRyxFQUFFO0lBQ3pCLGtCQUFrQjtJQUNsQixNQUFNLGNBQWMsR0FBRyxNQUFNLENBQUM7SUFDOUIsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7UUFDM0IsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7S0FDckM7SUFFRCwrQ0FBK0M7SUFDL0MsT0FBTyxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLE1BQWMsRUFBRSxFQUFFO1FBQ2hELE9BQU8sQ0FBQyxLQUFLLENBQUMsK0JBQStCLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDM0QsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDLENBQUM7QUFFRixNQUFNLENBQUMsTUFBTSxRQUFRLEdBQUcsQ0FBQyxJQUFTLEVBQXNCLEVBQUU7SUFFdEQsT0FBTyxJQUFJLENBQUE7QUFDZixDQUFDLENBQUEifQ==