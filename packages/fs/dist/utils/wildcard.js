function WildcardMatcher(text, separator) {
    this.text = text = text || '';
    this.hasWild = ~text.indexOf('*');
    this.separator = separator;
    this.parts = text.split(separator);
}
WildcardMatcher.prototype.match = (input) => {
    let matches = true;
    var thiz = this;
    const parts = thiz.parts || [];
    let ii;
    const partsCount = parts.length;
    let testParts;
    if (typeof input === 'string' || input instanceof String) {
        if (!thiz.hasWild && thiz.text !== input) {
            matches = false;
        }
        else {
            testParts = (input || '').split(thiz.separator);
            for (ii = 0; matches && ii < partsCount; ii++) {
                if (parts[ii] === '*') {
                    continue;
                }
                else if (ii < testParts.length) {
                    matches = parts[ii] === testParts[ii];
                }
                else {
                    matches = false;
                }
            }
            // If matches, then return the component parts
            matches = matches && testParts;
        }
    }
    else if (typeof input.splice === 'function') {
        matches = [];
        for (ii = input.length; ii--;) {
            if (thiz.match(input[ii])) {
                matches[matches.length] = input[ii];
            }
        }
    }
    else if (typeof input === 'object') {
        matches = {};
        for (const key in input) {
            if (thiz.match(key)) {
                matches[key] = input[key];
            }
        }
    }
    return matches;
};
export default function (text, test, separator) {
    const matcher = new WildcardMatcher(text, separator || /[/.]/);
    if (typeof test !== 'undefined') {
        return matcher.match(test);
    }
    return matcher;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2lsZGNhcmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdXRpbHMvd2lsZGNhcmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxlQUFlLENBQUMsSUFBSSxFQUFFLFNBQVM7SUFDdkMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQztJQUM5QixJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNsQyxJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztJQUMzQixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDcEMsQ0FBQztBQUVELGVBQWUsQ0FBQyxTQUFTLENBQUMsS0FBSyxHQUFHLENBQUMsS0FBSyxFQUFFLEVBQUU7SUFDM0MsSUFBSSxPQUFPLEdBQWtDLElBQUksQ0FBQztJQUNsRCxJQUFJLElBQUksR0FBUSxJQUFJLENBQUM7SUFDckIsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUM7SUFDL0IsSUFBSSxFQUFFLENBQUM7SUFDUCxNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDO0lBQ2hDLElBQUksU0FBUyxDQUFDO0lBRWQsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksS0FBSyxZQUFZLE1BQU0sRUFBRSxDQUFDO1FBQzFELElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssS0FBSyxFQUFFLENBQUM7WUFDMUMsT0FBTyxHQUFHLEtBQUssQ0FBQztRQUNqQixDQUFDO2FBQU0sQ0FBQztZQUNQLFNBQVMsR0FBRyxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ2hELEtBQUssRUFBRSxHQUFHLENBQUMsRUFBRSxPQUFPLElBQUksRUFBRSxHQUFHLFVBQVUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUMvQyxJQUFJLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztvQkFDdkIsU0FBUztnQkFDVixDQUFDO3FCQUFNLElBQUksRUFBRSxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztvQkFDbEMsT0FBTyxHQUFHLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ3ZDLENBQUM7cUJBQU0sQ0FBQztvQkFDUCxPQUFPLEdBQUcsS0FBSyxDQUFDO2dCQUNqQixDQUFDO1lBQ0YsQ0FBQztZQUVELDhDQUE4QztZQUM5QyxPQUFPLEdBQUcsT0FBTyxJQUFJLFNBQVMsQ0FBQztRQUNoQyxDQUFDO0lBQ0YsQ0FBQztTQUFLLElBQUksT0FBTyxLQUFLLENBQUMsTUFBTSxLQUFLLFVBQVUsRUFBRSxDQUFDO1FBQzlDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFFYixLQUFLLEVBQUUsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxHQUFHLENBQUM7WUFDL0IsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQzNCLE9BQU8sQ0FBRSxPQUFvQixDQUFDLE1BQU0sQ0FBQyxHQUFHLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNuRCxDQUFDO1FBQ0YsQ0FBQztJQUNGLENBQUM7U0FBSyxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRSxDQUFDO1FBQ3JDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFFYixLQUFLLE1BQU0sR0FBRyxJQUFJLEtBQUssRUFBRSxDQUFDO1lBQ3pCLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUNyQixPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzNCLENBQUM7UUFDRixDQUFDO0lBQ0YsQ0FBQztJQUVELE9BQU8sT0FBTyxDQUFDO0FBQ2hCLENBQUMsQ0FBQztBQUVGLE1BQU0sQ0FBQyxPQUFPLFdBQVcsSUFBWSxFQUFFLElBQVksRUFBRSxTQUEyQjtJQUMvRSxNQUFNLE9BQU8sR0FBRyxJQUFJLGVBQWUsQ0FBQyxJQUFJLEVBQUUsU0FBUyxJQUFJLE1BQU0sQ0FBQyxDQUFDO0lBQy9ELElBQUksT0FBTyxJQUFJLEtBQUssV0FBVyxFQUFFLENBQUM7UUFDakMsT0FBTyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzVCLENBQUM7SUFFRCxPQUFPLE9BQU8sQ0FBQztBQUNoQixDQUFDIn0=