import sys
import json
import argparse
import asyncio
import os
from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, CacheMode
from crawl4ai.extraction_strategy import JsonCssExtractionStrategy, JsonXPathExtractionStrategy
# --- Add Deep Crawl Strategy Imports ---
from crawl4ai.deep_crawling import (
    BFSDeepCrawlStrategy,
    DFSDeepCrawlStrategy,
    BestFirstCrawlingStrategy
)

def load_json_config(config_path):
    """Loads a JSON configuration file."""
    if not config_path or not os.path.exists(config_path):
        # print(f"Warning: Config file not found: {config_path}", file=sys.stderr)
        return {}
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in config file '{config_path}': {e}", file=sys.stderr)
        sys.exit(1)
    except IOError as e:
        print(f"Error: Could not read config file '{config_path}': {e}", file=sys.stderr)
        sys.exit(1)

async def main(url, schema_path, strategy_type, output_mode, output_file,
               browser_config_path, crawler_config_path, bypass_cache, verbose,
               # --- Add Deep Crawl Arguments ---
               deep_crawl_strategy_name, max_depth, include_external, max_pages, stream_results,
               # --- Add New Config Arguments ---
               headless, user_agent, text_mode, light_mode, 
               wait_for, screenshot, pdf, js_code, word_count_threshold):

    output_dir = os.path.dirname(output_file)
    if output_dir and not os.path.exists(output_dir):
        print(f"Error: Output directory does not exist: {output_dir}", file=sys.stderr)
        sys.exit(1)

    # Load configurations from files
    schema_config = load_json_config(schema_path) # Used only if output_mode is json
    browser_config = load_json_config(browser_config_path)
    crawler_config = load_json_config(crawler_config_path)

    # --- Prepare CrawlerRunConfig arguments --- 
    run_config_kwargs = crawler_config.copy() # Start with crawler config file content
    
    # --- Apply relevant CLI args to CrawlerRunConfig --- 
    if wait_for:
        run_config_kwargs['wait_for'] = wait_for
    if screenshot:
        run_config_kwargs['screenshot'] = True
    if pdf:
        run_config_kwargs['pdf'] = True
    if js_code:
        run_config_kwargs['js_code'] = js_code
    if word_count_threshold is not None:
        run_config_kwargs['word_count_threshold'] = word_count_threshold

    # --- Set default wait_until if not provided ---
    if 'wait_until' not in run_config_kwargs:
        run_config_kwargs['wait_until'] = 'networkidle'

    # Set cache mode ONLY if bypassCache is true
    if bypass_cache:
        run_config_kwargs['cache_mode'] = CacheMode.BYPASS
    # Otherwise, let crawl4ai use its default cache mode

    # Add extraction strategy if JSON mode
    if output_mode == 'json':
        if not schema_config:
            # If --schema path wasn't provided or file was empty/invalid, but mode is json
            print(f"Error: Schema file ('{schema_path}') is required and must contain valid JSON for json output mode.", file=sys.stderr)
            sys.exit(1)
        if strategy_type == 'css':
            extraction_strategy = JsonCssExtractionStrategy(schema_config, verbose=verbose)
        elif strategy_type == 'xpath':
            extraction_strategy = JsonXPathExtractionStrategy(schema_config, verbose=verbose)
        else:
             # This case should ideally be caught by argparse choices, but added for safety
            print(f"Error: Invalid strategy type '{strategy_type}'. Use 'css' or 'xpath'.", file=sys.stderr)
            sys.exit(1)
        run_config_kwargs['extraction_strategy'] = extraction_strategy
    elif output_mode == 'markdown':
        pass # Markdown handled by default or potentially via crawler_config
    else:
        print(f"Error: Invalid output mode '{output_mode}'. Use 'json' or 'markdown'.", file=sys.stderr)
        sys.exit(1)

    # --- Configure Deep Crawling Strategy ---
    deep_crawl_strategy = None
    if deep_crawl_strategy_name:
        if max_depth is None: # Max depth is required for any deep crawl strategy
            print("Error: --max-depth is required when using a --deep-crawl-strategy.", file=sys.stderr)
            sys.exit(1)

        strategy_args = {
            'max_depth': max_depth,
            'include_external': include_external,
            'max_pages': max_pages # Can be None
        }
        # Remove None values as crawl4ai expects absence, not None
        strategy_args = {k: v for k, v in strategy_args.items() if v is not None}

        if deep_crawl_strategy_name == 'bfs':
            deep_crawl_strategy = BFSDeepCrawlStrategy(**strategy_args)
        elif deep_crawl_strategy_name == 'dfs':
            deep_crawl_strategy = DFSDeepCrawlStrategy(**strategy_args)
        elif deep_crawl_strategy_name == 'bestfirst':
            # Note: BestFirstCrawlingStrategy might ideally need a scorer, 
            # which we are not configuring via CLI here for simplicity.
            # It will work without one, but might not be 'best first'.
            deep_crawl_strategy = BestFirstCrawlingStrategy(**strategy_args)
        
        run_config_kwargs['deep_crawl_strategy'] = deep_crawl_strategy

    # --- Add stream option ---
    if stream_results:
        run_config_kwargs['stream'] = True

    # Create CrawlerRunConfig
    try:
        # Add verbose setting to the config as well
        run_config_kwargs['verbose'] = verbose 
        # Only pass kwargs if the loaded config was not empty
        if run_config_kwargs:
            config = CrawlerRunConfig(**run_config_kwargs)
        else:
            # Ensure verbose is set even with default config
            config = CrawlerRunConfig(verbose=verbose) 
    except TypeError as e:
        print(f"Error creating CrawlerRunConfig. Check crawler config file content or arguments: {e}", file=sys.stderr)
        sys.exit(1)

    # --- Prepare AsyncWebCrawler arguments --- 
    crawler_kwargs = browser_config.copy() # Start with browser config file content
    crawler_kwargs['verbose'] = verbose

    # --- Apply relevant CLI args to BrowserConfig/AsyncWebCrawler --- 
    # Note: headless default is True in argparse, so we only override if False
    if headless is False:
        crawler_kwargs['headless'] = False
    if user_agent:
        crawler_kwargs['user_agent'] = user_agent
    if text_mode:
        crawler_kwargs['text_mode'] = True
    if light_mode:
        crawler_kwargs['light_mode'] = True

    try:
        # Create crawler instance
         # Only pass kwargs if the loaded config was not empty
        if crawler_kwargs:
            crawler_instance = AsyncWebCrawler(**crawler_kwargs)
        else:
            # Should not happen as verbose is always added, but for safety:
            crawler_instance = AsyncWebCrawler() 

        # Attempt to redirect logger to stderr if not verbose (to keep final output clean)
        if not verbose:
            try:
                if hasattr(crawler_instance, 'logger') and hasattr(crawler_instance.logger, 'set_output_stream'):
                    crawler_instance.logger.set_output_stream(sys.stderr)
                elif hasattr(crawler_instance, 'logger') and hasattr(crawler_instance.logger, 'handlers'):
                    for handler in crawler_instance.logger.handlers:
                        if hasattr(handler, 'setStream'): handler.setStream(sys.stderr)
                        elif hasattr(handler, 'stream'): handler.stream = sys.stderr
            except Exception as log_config_err:
                 # Non-fatal warning if redirection fails
                print(f"Warning: Could not redirect non-verbose crawler logger to stderr: {log_config_err}", file=sys.stderr)

        # Run the crawler
        async with crawler_instance as crawler:
            results = await crawler.arun(
                url=url,
                config=config
            )

        # --- Handle Single vs Multiple Results ---
        # If streaming or deep crawling, results is an async iterator or list
        # If not, result is a single CrawlResult object (check type)

        output_data = []
        final_output_string = ""

        if isinstance(results, list): # Non-streaming deep crawl or simple crawl (always list?)
            crawl_results = results
        elif hasattr(results, '__aiter__'): # Streaming deep crawl
             crawl_results = [res async for res in results]
        else: # Simple, non-streaming crawl (should yield a single CrawlResult object)
            crawl_results = [results] # Treat as a list with one item

        # Process results
        successful_results = []
        for result in crawl_results:
            if result.success:
                successful_results.append(result)
            else:
                print(f"Warning: Crawl failed for URL '{result.url}': {result.error_message}", file=sys.stderr)

        if not successful_results:
             print(f"Error: All crawls failed or no results were obtained.", file=sys.stderr)
             sys.exit(1)


        # --- Prepare Output ---
        if output_mode == 'json':
            # If multiple results, output a list of JSON objects
            # If single result, output just that JSON object (for backward compatibility maybe?)
            # Decision: Always output a list for consistency when deep crawling *could* be used.
            json_list = [res.extracted_content for res in successful_results if res.extracted_content is not None]
            # If the original call was likely a simple crawl (no deep strategy, no stream)
            # and only one result, output the single object. Otherwise, list.
            if deep_crawl_strategy is None and not stream_results and len(json_list) == 1:
                 final_output_string = json.dumps(json_list[0], ensure_ascii=False, indent=2)
            else:
                 final_output_string = json.dumps(json_list, ensure_ascii=False, indent=2)

        elif output_mode == 'markdown':
            # Concatenate markdown from all successful results
            markdown_parts = [res.markdown for res in successful_results if res.markdown is not None]
            # Use triple quotes for the multi-line separator string
            final_output_string = """

---

""".join(markdown_parts) # Separator between pages

        # Write output to the specified file
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                 f.write(final_output_string)
            sys.exit(0) # Success
        except IOError as e:
            print(f"Error: Could not write to output file '{output_file}': {e}", file=sys.stderr)
            sys.exit(1)

    except TypeError as e:
         print(f"Error creating AsyncWebCrawler. Check browser config file content or arguments: {e}", file=sys.stderr)
         sys.exit(1)
    except Exception as e:
        # Force stderr to UTF-8 as well for error messages
        try: sys.stderr.reconfigure(encoding='utf-8')
        except Exception: pass
        print(f"Error: An unexpected error occurred during processing: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Crawl a URL and write content to a file using crawl4ai library.')
    parser.add_argument('url', help='The URL to crawl.')
    parser.add_argument(
        '-s', '--schema',
        dest='schema_path',
        help='Path to JSON schema file for extraction (required for json output mode).',
        default=None
    )
    parser.add_argument(
        '--strategy-type',
        help="Extraction strategy type ('css' or 'xpath'). Used only with --schema.",
        choices=['css', 'xpath'],
        default='css'
    )
    parser.add_argument(
        '-o', '--output-mode',
        help="Output mode ('json' or 'markdown').",
        choices=['json', 'markdown'],
        required=True
    )
    parser.add_argument(
        '-O', '--output-file',
        dest='output_file',
        help="Path to write the output file.",
        required=True
    )
    parser.add_argument(
        '-B', '--browser-config',
        dest='browser_config_path',
        help='Path to browser config file (JSON format).',
        default=None
    )
    parser.add_argument(
        '-C', '--crawler-config',
        dest='crawler_config_path',
        help='Path to crawler config file (JSON format).',
        default=None
    )
    parser.add_argument(
        '--bypass-cache',
        action='store_true',
        help='Bypass cache when crawling.'
    )
    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='Enable verbose logging.'
    )

    # --- Add Deep Crawling Arguments to Parser ---
    parser.add_argument(
        '--deep-crawl-strategy',
        choices=['bfs', 'dfs', 'bestfirst'],
        default=None,
        help='Deep crawling strategy to use (bfs, dfs, bestfirst). Requires --max-depth.'
    )
    parser.add_argument(
        '--max-depth',
        type=int,
        default=None,
        help='Maximum crawl depth beyond the starting page. Required if --deep-crawl-strategy is set.'
    )
    parser.add_argument(
        '--include-external',
        action='store_true',
        help='Allow the crawler to follow links to external domains.'
    )
    parser.add_argument(
        '--max-pages',
        type=int,
        default=None,
        help='Maximum number of pages to crawl in total.'
    )
    parser.add_argument(
        '--stream',
        dest='stream_results',
        action='store_true',
        help='Process and potentially output results as they become available (streaming).'
    )

    # --- Add New Config Arguments to Parser ---
    parser.add_argument(
        '--no-headless',
        action='store_false',
        dest='headless', # Sets args.headless to False if flag exists
        help='Run browser in visible mode (default is headless).'
        # Default is implicitly True because action is store_false
    )
    parser.add_argument(
        '--user-agent',
        type=str,
        default=None,
        help='Specify a custom User-Agent string.'
    )
    parser.add_argument(
        '--text-mode',
        action='store_true',
        help='Enable text mode (disables images, etc.).'
    )
    parser.add_argument(
        '--light-mode',
        action='store_true',
        help='Enable light mode (performance optimization).'
    )
    parser.add_argument(
        '--wait-for',
        type=str,
        default=None,
        help='CSS selector or JS expression to wait for before extraction.'
    )
    parser.add_argument(
        '--screenshot',
        action='store_true',
        help='Capture a screenshot of the page.'
    )
    parser.add_argument(
        '--pdf',
        action='store_true',
        help='Generate a PDF of the page.'
    )
    parser.add_argument(
        '--js-code',
        type=str,
        default=None,
        help='JavaScript code to execute on the page before extraction.'
    )
    parser.add_argument(
        '--word-count-threshold',
        type=int,
        default=None,
        help='Minimum word count for markdown content blocks.'
    )

    args = parser.parse_args()

    if args.output_mode == 'json' and not args.schema_path:
        parser.error('--schema <PATH> is required when --output-mode is json')

    if args.deep_crawl_strategy and args.max_depth is None:
         parser.error('--max-depth is required when using --deep-crawl-strategy')

    asyncio.run(main(
        url=args.url,
        schema_path=args.schema_path,
        strategy_type=args.strategy_type,
        output_mode=args.output_mode,
        output_file=args.output_file,
        browser_config_path=args.browser_config_path,
        crawler_config_path=args.crawler_config_path,
        bypass_cache=args.bypass_cache,
        verbose=args.verbose,
        # Pass new args
        deep_crawl_strategy_name=args.deep_crawl_strategy,
        max_depth=args.max_depth,
        include_external=args.include_external,
        max_pages=args.max_pages,
        stream_results=args.stream_results,
        # Pass new config args
        headless=args.headless,
        user_agent=args.user_agent,
        text_mode=args.text_mode,
        light_mode=args.light_mode,
        wait_for=args.wait_for,
        screenshot=args.screenshot,
        pdf=args.pdf,
        js_code=args.js_code,
        word_count_threshold=args.word_count_threshold
    )) 