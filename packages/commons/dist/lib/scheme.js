export const escapeFirstUrlSegment = (url) => {
    const schemeEndIndex = url.indexOf('://') + 3;
    const restOfUrl = url.slice(schemeEndIndex);
    const questionMarkIndex = restOfUrl.indexOf('?');
    if (questionMarkIndex !== -1) {
        const firstSegment = restOfUrl.slice(0, questionMarkIndex);
        const escapedFirstSegment = encodeURIComponent(firstSegment);
        return url.slice(0, schemeEndIndex) + escapedFirstSegment + restOfUrl.slice(questionMarkIndex);
    }
    else {
        const escapedFirstSegment = encodeURIComponent(restOfUrl);
        return url.slice(0, schemeEndIndex) + escapedFirstSegment;
    }
};
export const parseURL = (url) => {
    const trimmedUrl = escapeFirstUrlSegment(url.trim());
    //const urlPattern = /^([a-zA-Z][a-zA-Z\d+.-]*):\/\/([^\/\s?#]*)([^\s?#]*)?(\?[^#\s]*)?(#[^\s]*)?$/;
    const urlPattern = /([a-zA-Z]{2,20}):\/\/([\w_-]+(?:(?:\.[\w_-]+)?))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?/igm;
    const match = trimmedUrl.match(urlPattern);
    if (!match) {
        return null;
    }
    // Destructure the match groups
    const [, scheme, host, path, queryString, fragment] = match;
    // Parse query string if present
    const query = {};
    if (queryString) {
        queryString
            .substring(1)
            .split("&")
            .forEach((param) => {
            const [key, value] = param.split("=");
            query[decodeURIComponent(key)] = value ? decodeURIComponent(value) : "";
        });
    }
    // Return the parsed URL as an object
    return {
        scheme,
        host: host || undefined,
        path: path || undefined,
        query: Object.keys(query).length > 0 ? query : undefined,
        fragment: fragment ? fragment.substring(1) : undefined,
    };
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZW1lLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2xpYi9zY2hlbWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBT0EsTUFBTSxDQUFDLE1BQU0scUJBQXFCLEdBQUcsQ0FBQyxHQUFXLEVBQVUsRUFBRTtJQUN6RCxNQUFNLGNBQWMsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM5QyxNQUFNLFNBQVMsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0lBQzVDLE1BQU0saUJBQWlCLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUVqRCxJQUFJLGlCQUFpQixLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDM0IsTUFBTSxZQUFZLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztRQUMzRCxNQUFNLG1CQUFtQixHQUFHLGtCQUFrQixDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQzdELE9BQU8sR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsY0FBYyxDQUFDLEdBQUcsbUJBQW1CLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0lBQ25HLENBQUM7U0FBTSxDQUFDO1FBQ0osTUFBTSxtQkFBbUIsR0FBRyxrQkFBa0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUMxRCxPQUFPLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLGNBQWMsQ0FBQyxHQUFHLG1CQUFtQixDQUFDO0lBQzlELENBQUM7QUFDTCxDQUFDLENBQUE7QUFDRCxNQUFNLENBQUMsTUFBTSxRQUFRLEdBQUcsQ0FBQyxHQUFXLEVBQW9CLEVBQUU7SUFDdEQsTUFBTSxVQUFVLEdBQUcscUJBQXFCLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUE7SUFDcEQsb0dBQW9HO0lBQ3BHLE1BQU0sVUFBVSxHQUFHLDBGQUEwRixDQUFBO0lBQzdHLE1BQU0sS0FBSyxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUE7SUFDMUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ1QsT0FBTyxJQUFJLENBQUE7SUFDZixDQUFDO0lBRUQsK0JBQStCO0lBQy9CLE1BQU0sQ0FBQyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxRQUFRLENBQUMsR0FBRyxLQUFLLENBQUE7SUFFM0QsZ0NBQWdDO0lBQ2hDLE1BQU0sS0FBSyxHQUEyQixFQUFFLENBQUE7SUFDeEMsSUFBSSxXQUFXLEVBQUUsQ0FBQztRQUNkLFdBQVc7YUFDTixTQUFTLENBQUMsQ0FBQyxDQUFDO2FBQ1osS0FBSyxDQUFDLEdBQUcsQ0FBQzthQUNWLE9BQU8sQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFO1lBQ2YsTUFBTSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3RDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUM1RSxDQUFDLENBQUMsQ0FBQTtJQUNWLENBQUM7SUFFRCxxQ0FBcUM7SUFDckMsT0FBTztRQUNILE1BQU07UUFDTixJQUFJLEVBQUUsSUFBSSxJQUFJLFNBQVM7UUFDdkIsSUFBSSxFQUFFLElBQUksSUFBSSxTQUFTO1FBQ3ZCLEtBQUssRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsU0FBUztRQUN4RCxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTO0tBQ3pELENBQUE7QUFDTCxDQUFDLENBQUEifQ==