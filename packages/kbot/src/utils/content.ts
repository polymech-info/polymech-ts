export const content = (result: any): string => {
    return result?.choices?.[0]?.message?.content || ""
}