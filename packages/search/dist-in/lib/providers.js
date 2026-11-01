import { getJson as searchSerpAPI } from "serpapi";
import { search as searchScaleserp } from './scalesep.js';
export const SearchProviders = {
    scaleserp: searchScaleserp,
    serpApi: searchSerpAPI
};
export const cleanOptions = (opts) => {
    return {
        ...opts,
        openai: 'hidden',
        bigdata: 'hidden',
        api_key: 'hidden',
        geocode_key: 'hidden'
    };
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdmlkZXJzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2xpYi9wcm92aWRlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLE9BQU8sSUFBSSxhQUFhLEVBQUUsTUFBTSxTQUFTLENBQUE7QUFDbEQsT0FBTyxFQUFFLE1BQU0sSUFBSSxlQUFlLEVBQUUsTUFBTSxlQUFlLENBQUE7QUFFekQsTUFBTSxDQUFDLE1BQU0sZUFBZSxHQUFHO0lBQzNCLFNBQVMsRUFBRSxlQUFlO0lBQzFCLE9BQU8sRUFBRSxhQUFhO0NBQ3pCLENBQUE7QUFFRCxNQUFNLENBQUMsTUFBTSxZQUFZLEdBQUcsQ0FBQyxJQUFTLEVBQUUsRUFBRTtJQUN0QyxPQUFPO1FBQ0gsR0FBRyxJQUFJO1FBQ1AsTUFBTSxFQUFFLFFBQVE7UUFDaEIsT0FBTyxFQUFFLFFBQVE7UUFDakIsT0FBTyxFQUFFLFFBQVE7UUFDakIsV0FBVyxFQUFFLFFBQVE7S0FDeEIsQ0FBQTtBQUNMLENBQUMsQ0FBQSJ9