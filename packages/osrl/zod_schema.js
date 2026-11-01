"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.types = exports.compilerOptions = exports.compilerVariables = void 0;
const zod_1 = require("zod");
// import { CommonLanguageCodeSchema, TargetLanguageCodeSchema } from '@plastichub/osr-i18n'
const osr_log_1 = require("@plastichub/osr-log/");
const osr_commons_1 = require("@plastichub/osr-commons");
//const CommonLanguageCodeSchema = z.ZodEnum<["en", "pt", "bg", "cs", "da", "de", "el", "es", "et", "fi", "fr", "hu", "id", "it", "ja", "ko", "lt", "lv", "nb", "nl", "pl", "ro", "ru", "sk", "sl", "sv", "tr", "uk", "zh"]>;
//const TargetLanguageCodeSchema = z.ZodUnion<[z.ZodEnum<["en", "pt", "bg", "cs", "da", "de", "el", "es", "et", "fi", "fr", "hu", "id", "it", "ja", "ko", "lt", "lv", "nb", "nl", "pl", "ro", "ru", "sk", "sl", "sv", "tr", "uk", "zh"]>, z.ZodEnum<["en-GB", "en-US", "pt-BR", "pt-PT"]>]>;
const compilerVariables = () => zod_1.z.object({
    targetLanguage: zod_1.z.string().default('en'),
    sourceLanguage: zod_1.z.string().default('en'),
    i18n: zod_1.z.string().default((0, osr_commons_1.OSR_ROOT)()),
}).passthrough();
exports.compilerVariables = compilerVariables;
const compilerOptions = () => zod_1.z.object({
    logLevel: osr_log_1.TLogLevelNameSchema.default('info'),
    root: zod_1.z.string().default(`${process.cwd()}`),
    cwd: zod_1.z.string().default(`${process.cwd()}`),
    env: zod_1.z.string().default('hugo-debug'),
    format: zod_1.z.string().default('html'),
    template: zod_1.z.string().optional().describe('Template ifle'),
    output: zod_1.z.string().optional().describe('The destination file'),
    source: zod_1.z.string().optional().describe('The source file'),
    trace: zod_1.z.string().default("${SRC_DIR}/${SRC_NAME}-trace.json"),
    language: zod_1.z.string().default('osr'),
    profile: zod_1.z.string().optional().default('${OSR_ROOT}/osr-templates/osrl/.osrl.json'),
    watchContent: zod_1.z.boolean().default(false),
    cache: zod_1.z.boolean().default(true),
    stdout: zod_1.z.boolean().default(false),
    module: zod_1.z.string().default('osr-module'),
    variables: (0, exports.compilerVariables)().default({
        targetLanguage: 'en',
        sourceLanguage: 'en',
        i18n: (0, osr_commons_1.OSR_ROOT)()
    }),
}, { description: 'ICompileOptions' }).passthrough();
exports.compilerOptions = compilerOptions;
const types = () => (0, osr_commons_1.generate_interfaces)([
    (0, exports.compilerOptions)()
], 'src/zod_types.ts');
exports.types = types;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiem9kX3NjaGVtYS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNyYy96b2Rfc2NoZW1hLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDZCQUF1QjtBQUV2Qiw0RkFBNEY7QUFDNUYsa0RBQTBEO0FBQzFELHlEQUF1RTtBQUV2RSw2TkFBNk47QUFDN04sNFJBQTRSO0FBRXJSLE1BQU0saUJBQWlCLEdBQUcsR0FBRyxFQUFFLENBQUMsT0FBQyxDQUFDLE1BQU0sQ0FBQztJQUM1QyxjQUFjLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7SUFDeEMsY0FBYyxFQUFFLE9BQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO0lBQ3hDLElBQUksRUFBRSxPQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUEsc0JBQVEsR0FBRSxDQUFDO0NBQ3ZDLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQUpILFFBQUEsaUJBQWlCLHFCQUlkO0FBRVQsTUFBTSxlQUFlLEdBQUcsR0FBRyxFQUFFLENBQUMsT0FBQyxDQUFDLE1BQU0sQ0FBQztJQUMxQyxRQUFRLEVBQUUsNkJBQW1CLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQztJQUM3QyxJQUFJLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDO0lBQzVDLEdBQUcsRUFBRSxPQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsT0FBTyxDQUFDLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUM7SUFDM0MsR0FBRyxFQUFFLE9BQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDO0lBQ3JDLE1BQU0sRUFBRSxPQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQztJQUNsQyxRQUFRLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUM7SUFDekQsTUFBTSxFQUFFLE9BQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxRQUFRLENBQUMsc0JBQXNCLENBQUM7SUFDOUQsTUFBTSxFQUFFLE9BQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLENBQUM7SUFDekQsS0FBSyxFQUFFLE9BQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxPQUFPLENBQUMsbUNBQW1DLENBQUM7SUFDOUQsUUFBUSxFQUFFLE9BQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO0lBQ25DLE9BQU8sRUFBRSxPQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUMsT0FBTyxDQUFDLDJDQUEyQyxDQUFDO0lBQ25GLFlBQVksRUFBRSxPQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQztJQUN4QyxLQUFLLEVBQUUsT0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7SUFDaEMsTUFBTSxFQUFFLE9BQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO0lBQ2xDLE1BQU0sRUFBRSxPQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQztJQUN4QyxTQUFTLEVBQUUsSUFBQSx5QkFBaUIsR0FBRSxDQUFDLE9BQU8sQ0FBQztRQUNuQyxjQUFjLEVBQUUsSUFBSTtRQUNwQixjQUFjLEVBQUUsSUFBSTtRQUNwQixJQUFJLEVBQUUsSUFBQSxzQkFBUSxHQUFFO0tBQ25CLENBQUM7Q0FDTCxFQUFFLEVBQUUsV0FBVyxFQUFFLGlCQUFpQixFQUFFLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtBQXJCdkMsUUFBQSxlQUFlLG1CQXFCd0I7QUFFN0MsTUFBTSxLQUFLLEdBQUcsR0FBRyxFQUFFLENBQUMsSUFBQSxpQ0FBbUIsRUFDMUM7SUFDSSxJQUFBLHVCQUFlLEdBQUU7Q0FDcEIsRUFBRSxrQkFBa0IsQ0FBQyxDQUFBO0FBSGIsUUFBQSxLQUFLLFNBR1EifQ==