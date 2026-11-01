export var EPlatform;
(function (EPlatform) {
    EPlatform["Linux"] = "linux";
    EPlatform["Windows"] = "win32";
    EPlatform["OSX"] = "darwin";
})(EPlatform || (EPlatform = {}));
export var EArch;
(function (EArch) {
    EArch["x64"] = "64";
    EArch["x32"] = "32";
})(EArch || (EArch = {}));
export const is_windows = () => process && (process.platform === 'win32');
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvb3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsTUFBTSxDQUFOLElBQVksU0FJWDtBQUpELFdBQVksU0FBUztJQUNwQiw0QkFBZSxDQUFBO0lBQ2YsOEJBQWlCLENBQUE7SUFDakIsMkJBQWMsQ0FBQTtBQUNmLENBQUMsRUFKVyxTQUFTLEtBQVQsU0FBUyxRQUlwQjtBQUNELE1BQU0sQ0FBTixJQUFZLEtBR1g7QUFIRCxXQUFZLEtBQUs7SUFDaEIsbUJBQVUsQ0FBQTtJQUNWLG1CQUFVLENBQUE7QUFDWCxDQUFDLEVBSFcsS0FBSyxLQUFMLEtBQUssUUFHaEI7QUFDRCxNQUFNLENBQUMsTUFBTSxVQUFVLEdBQUcsR0FBRyxFQUFFLENBQUMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsS0FBSyxPQUFPLENBQUMsQ0FBQSJ9