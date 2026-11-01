import { Logger } from "tslog";
import { statSync } from "node:fs";
import { sep, resolve as pathResolve, parse as pathParse, relative as pathRelative } from "node:path";
import { readFile } from "node:fs/promises";
import { DEFAULT_ROOTS, DEFAULT_VARS, pathInfoEx, resolveVariables } from "@polymech/commons";
import { convertPdfToImages } from "./pdf.js";
import { DEFAULT_OUTPUT_TEMPLATE } from "../constants.js";
import type { ConvertCommandConfig } from "../types.js";

/**
 * Runs the PDF to images conversion process.
 * Generates variables, determines output path, reads PDF, and calls the conversion engine.
 * @param config - The conversion configuration options (inferred from Zod schema).
 * @param logger - The logger instance to use for logging.
 * @returns A promise that resolves with an array of generated image file paths.
 */
export async function runConversion(config: ConvertCommandConfig, logger: Logger<any>): Promise<string[]> {
  const inputPath = pathResolve(config.input);
  let srcInfo: any = {};
  try {
    srcInfo = pathInfoEx(inputPath);
    const parsed = pathParse(inputPath);
    srcInfo = {
      ...srcInfo,
      SRC_DIR: parsed.dir,
      SRC_NAME: parsed.name,
      SRC_EXT: parsed.ext,
    };
  } catch (e) {
    logger.warn("pathInfoEx not found or failed, using basic path.parse");
  }

  let baseVariables: Record<string, any> = {
    ...DEFAULT_ROOTS,
    ...DEFAULT_VARS({}),
    ...srcInfo,
    DPI: config.dpi,
    FORMAT: config.format,
  };

  if (baseVariables.ROOT && baseVariables.SRC_DIR) {
      baseVariables.SRC_REL = pathRelative(baseVariables.ROOT, baseVariables.SRC_DIR);
  }

  const srcName = baseVariables.SRC_NAME || '';
  const dashed = srcName.split('-');
  if (dashed.length > 1) {
      for (let i = 0; i < dashed.length; i++) {
          baseVariables[`SRC_NAME-${i}`] = dashed[i];
      }
  }
  const dotted = srcName.split('.');
  if (dotted.length > 1) {
      for (let i = 0; i < dotted.length; i++) {
          baseVariables[`SRC_NAME.${i}`] = dotted[i];
      }
  }
  const underscored = srcName.split('_');
  if (underscored.length > 1) {
      for (let i = 0; i < underscored.length; i++) {
          baseVariables[`SRC_NAME_${i}`] = underscored[i];
      }
  }
  
  // Process var-* arguments directly from config object passed in
  const cliVars = Object.keys(config).filter(k => k.startsWith('var-')).reduce((acc, k) => {
      acc[k.replace('var-', '').toUpperCase()] = config[k];
      return acc;
  }, {} as Record<string, any>);

  // Uppercase base variable keys
  baseVariables = Object.keys(baseVariables).reduce((acc, key) => {
      acc[key.toUpperCase()] = baseVariables[key];
      return acc;
  }, {} as Record<string, any>);
  
  baseVariables = { ...baseVariables, ...cliVars };

  let outputPathTemplate: string;
  let isExplicitDir = false;

  if (config.output) {
      const outputPath = pathResolve(config.output);
      try {
          const stats = statSync(outputPath);
          if (stats.isDirectory()) {
              isExplicitDir = true;
          }
      } catch (e: any) {
          if (config.output.endsWith(sep) || config.output.endsWith("/")) {
                isExplicitDir = true;
          } else {
              isExplicitDir = false; 
          }
      }

      if (isExplicitDir) {
          baseVariables["OUT_DIR"] = outputPath;
          outputPathTemplate = "${OUT_DIR}/${SRC_NAME}_${PAGE}.${FORMAT}"; 
          logger.info(`Output directory specified: ${outputPath}`);
      } else {
          outputPathTemplate = config.output; 
          logger.info(`Using output path pattern: ${outputPathTemplate}`);
      }

  } else {
      // Use default pattern directly from constant
      outputPathTemplate = DEFAULT_OUTPUT_TEMPLATE; 
      logger.info(`Using default output path pattern: ${outputPathTemplate}`); 
  }

  // --- Read PDF and Call Conversion (moved from commands/convert.ts) ---
  logger.info(`Reading PDF: ${config.input}`);
  const pdfData = await readFile(config.input);
  
  logger.info(`Starting conversion process...`);
  const outputFiles = await convertPdfToImages(pdfData, {
    baseVariables,
    outputPathTemplate,
    dpi: config.dpi,
    format: config.format,
    scale: config.scale,
    startPage: config.startPage,
    endPage: config.endPage,
    logger
  });
  
  return outputFiles;
} 