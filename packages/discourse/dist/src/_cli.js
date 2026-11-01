export const defaults = () => {
    // default command
    const DefaultCommand = 'info';
    if (process.argv.length === 2) {
        process.argv.push(DefaultCommand);
    }
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
    // currently no default handler, display only :
    process.on('unhandledRejection', (reason) => {
        console.error('Unhandled rejection, reason: ', reason);
    });
};
//# sourceMappingURL=_cli.js.map