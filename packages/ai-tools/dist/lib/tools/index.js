import { z } from 'zod';
// see https://github.com/openai/openai-node/blob/master/examples/tool-call-helpers-zod.ts
export const zodFunction = ({ function: fn, schema, description = '', name, }) => {
    return {
        type: 'function',
        function: {
            function: fn,
            name: name ?? fn.name,
            description: description,
            parameters: z.toJSONSchema(schema),
            parse(input) {
                const obj = JSON.parse(input);
                return schema.parse(obj);
            }
        }
    };
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL3Rvb2xzL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBLE9BQU8sRUFBYSxDQUFDLEVBQUUsTUFBTSxLQUFLLENBQUE7QUFFbEMsMEZBQTBGO0FBQzFGLE1BQU0sQ0FBQyxNQUFNLFdBQVcsR0FBRSxDQUFtQixFQUN6QyxRQUFRLEVBQUUsRUFBRSxFQUNaLE1BQU0sRUFDTixXQUFXLEdBQUcsRUFBRSxFQUNoQixJQUFJLEdBTUwsRUFBcUMsRUFBRTtJQUN0QyxPQUFPO1FBQ0wsSUFBSSxFQUFFLFVBQVU7UUFDaEIsUUFBUSxFQUFFO1lBQ1IsUUFBUSxFQUFFLEVBQUU7WUFDWixJQUFJLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxJQUFJO1lBQ3JCLFdBQVcsRUFBRSxXQUFXO1lBQ3hCLFVBQVUsRUFBRSxDQUFDLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBZTtZQUNoRCxLQUFLLENBQUMsS0FBYTtnQkFDakIsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQTtnQkFDN0IsT0FBTyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBQzFCLENBQUM7U0FDRjtLQUNGLENBQUE7QUFDSCxDQUFDLENBQUEifQ==