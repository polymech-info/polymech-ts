import * as Minimatch from 'minimatch';
const patternToAbsolutePath = (basePath, pattern) => {
    // All patterns without slash are left as they are, if pattern contain
    // any slash we need to turn it into absolute path.
    const hasSlash = (pattern.includes('/'));
    const isAbsolute = /^!?\//.test(pattern);
    const isNegated = /^!/.test(pattern);
    let separator;
    if (!isAbsolute && hasSlash) {
        // Throw out meaningful characters from the beginning ("!", "./").
        pattern = pattern.replace(/^!/, '').replace(/^\.\//, '');
        if (/\/$/.test(basePath)) {
            separator = '';
        }
        else {
            separator = '/';
        }
        if (isNegated) {
            return '!' + basePath + separator + pattern;
        }
        return basePath + separator + pattern;
    }
    return pattern;
};
export function create(basePath, patterns, options) {
    let matchers;
    if (typeof patterns === 'string') {
        patterns = [patterns];
    }
    matchers = patterns.map(pattern => {
        return patternToAbsolutePath(basePath, pattern);
    }).map(pattern => {
        return new Minimatch.Minimatch(pattern, options || {
            matchBase: true,
            nocomment: true,
            dot: true
        });
    });
    return function performMatch(absolutePath) {
        let mode = 'matching';
        let weHaveMatch = false;
        let currentMatcher;
        let i;
        for (i = 0; i < matchers.length; i += 1) {
            currentMatcher = matchers[i];
            if (currentMatcher.negate) {
                mode = 'negation';
                if (i === 0) {
                    // There are only negated patterns in the set,
                    // so make everything matching by default and
                    // start to reject stuff.
                    weHaveMatch = true;
                }
            }
            if (mode === 'negation' && weHaveMatch && !currentMatcher.match(absolutePath)) {
                // One negation match is enought to know we can reject this one.
                return false;
            }
            if (mode === 'matching' && !weHaveMatch) {
                weHaveMatch = currentMatcher.match(absolutePath);
            }
        }
        return weHaveMatch;
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWF0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9tYXRjaGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sS0FBSyxTQUFTLE1BQU0sV0FBVyxDQUFBO0FBT3RDLE1BQU0scUJBQXFCLEdBQUcsQ0FBQyxRQUFnQixFQUFFLE9BQWUsRUFBVSxFQUFFO0lBQzNFLHNFQUFzRTtJQUN0RSxtREFBbUQ7SUFDbkQsTUFBTSxRQUFRLEdBQVksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDbEQsTUFBTSxVQUFVLEdBQVksT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNsRCxNQUFNLFNBQVMsR0FBWSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzlDLElBQUksU0FBUyxDQUFDO0lBRWQsSUFBSSxDQUFDLFVBQVUsSUFBSSxRQUFRLEVBQUUsQ0FBQztRQUM3QixrRUFBa0U7UUFDbEUsT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFekQsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7WUFDMUIsU0FBUyxHQUFHLEVBQUUsQ0FBQztRQUNoQixDQUFDO2FBQU0sQ0FBQztZQUNQLFNBQVMsR0FBRyxHQUFHLENBQUM7UUFDakIsQ0FBQztRQUVELElBQUksU0FBUyxFQUFFLENBQUM7WUFDZixPQUFPLEdBQUcsR0FBRyxRQUFRLEdBQUcsU0FBUyxHQUFHLE9BQU8sQ0FBQztRQUM3QyxDQUFDO1FBQ0QsT0FBTyxRQUFRLEdBQUcsU0FBUyxHQUFHLE9BQU8sQ0FBQztJQUN2QyxDQUFDO0lBRUQsT0FBTyxPQUFPLENBQUM7QUFDaEIsQ0FBQyxDQUFDO0FBRUYsTUFBTSxVQUFVLE1BQU0sQ0FBQyxRQUFnQixFQUFFLFFBQWtCLEVBQUUsT0FBa0I7SUFDOUUsSUFBSSxRQUFlLENBQUM7SUFDcEIsSUFBSSxPQUFPLFFBQVEsS0FBSyxRQUFRLEVBQUUsQ0FBQztRQUNsQyxRQUFRLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUN2QixDQUFDO0lBQ0QsUUFBUSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUU7UUFDakMsT0FBTyxxQkFBcUIsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDakQsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQ2hCLE9BQU8sSUFBSSxTQUFTLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxPQUFPLElBQUk7WUFDbEQsU0FBUyxFQUFFLElBQUk7WUFDZixTQUFTLEVBQUUsSUFBSTtZQUNmLEdBQUcsRUFBRSxJQUFJO1NBQ1QsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQUM7SUFFSCxPQUFPLFNBQVMsWUFBWSxDQUFDLFlBQW9CO1FBQ2hELElBQUksSUFBSSxHQUFHLFVBQVUsQ0FBQztRQUN0QixJQUFJLFdBQVcsR0FBRyxLQUFLLENBQUM7UUFDeEIsSUFBSSxjQUFjLENBQUM7UUFDbkIsSUFBSSxDQUFDLENBQUM7UUFFTixLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQ3pDLGNBQWMsR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDN0IsSUFBSSxjQUFjLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQzNCLElBQUksR0FBRyxVQUFVLENBQUM7Z0JBQ2xCLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO29CQUNiLDhDQUE4QztvQkFDOUMsNkNBQTZDO29CQUM3Qyx5QkFBeUI7b0JBQ3pCLFdBQVcsR0FBRyxJQUFJLENBQUM7Z0JBQ3BCLENBQUM7WUFDRixDQUFDO1lBRUQsSUFBSSxJQUFJLEtBQUssVUFBVSxJQUFJLFdBQVcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQztnQkFDL0UsZ0VBQWdFO2dCQUNoRSxPQUFPLEtBQUssQ0FBQztZQUNkLENBQUM7WUFFRCxJQUFJLElBQUksS0FBSyxVQUFVLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDekMsV0FBVyxHQUFHLGNBQWMsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDbEQsQ0FBQztRQUNGLENBQUM7UUFFRCxPQUFPLFdBQVcsQ0FBQztJQUNwQixDQUFDLENBQUM7QUFDSCxDQUFDIn0=