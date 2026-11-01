export const defaults = () => {
    const DefaultCommand = 'info';
    if (process.argv.length === 2) {
        process.argv.push(DefaultCommand);
    }
    process.on('unhandledRejection', (reason) => {
        console.error('Unhandled rejection, reason: ', reason);
    });
};
