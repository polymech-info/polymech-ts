export const removeEmpty = (data) => {
    //transform properties into key-values pairs and filter all the empty-values
    const entries = Object.entries(data).filter(([, value]) => value != null);
    //map through all the remaining properties and check if the value is an object.
    //if value is object, use recursion to remove empty properties
    const clean = entries.map(([key, v]) => {
        const value = typeof v == 'object' ? removeEmpty(v) : v;
        return [key, value];
    });
    //transform the key-value pairs back to an object.
    return Object.fromEntries(clean);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGliL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE1BQU0sQ0FBQyxNQUFNLFdBQVcsR0FBRyxDQUFDLElBQUksRUFBRSxFQUFFO0lBQ2hDLDRFQUE0RTtJQUM1RSxNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsRUFBRSxFQUFFLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxDQUFDO0lBRTFFLCtFQUErRTtJQUMvRSw4REFBOEQ7SUFDOUQsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUU7UUFDbkMsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLElBQUksUUFBUSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUN2RCxPQUFPLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFBO0lBQ3ZCLENBQUMsQ0FBQyxDQUFBO0lBRUYsa0RBQWtEO0lBQ2xELE9BQU8sTUFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQTtBQUNwQyxDQUFDLENBQUEifQ==