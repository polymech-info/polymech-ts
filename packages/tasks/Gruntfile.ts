import { logger } from './src'
process.on('unhandledRejection', (reason: string) => {
    console.error('Unhandled rejection, reason: ', reason);
})
export const grunt = (grunt) => {
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        cscart: {
            test: {
                src: [
                    '${PRODUCT_ROOT}/products/sheetpress/cassandra-mini'
                ],
                options: {
                    debug: true,
                    vendor: 1
                }
            }
        },
        compile: {
            newsletter: {
                src: [
                    "./tests/newsletter/src/stripo/**/*.md"
                ],
                options: {
                    output: './tests/newsletter/dist/en',
                    watchContent: true,
                    logLevel: 'trace'
                }
            }
        },
        sshexec: {
            test: {
                debug: false,
                verbose: false,
                commands: 'sh update-osr.sh'
            },
        },
        sync: {
            cad: {
                clean: true,
                debug: true,
                verbose: true,
                src: [
                    "./tests/cad/"
                ],
                target: './tests/sync',
                profile: '${OSR_ROOT}/osr-commons/profiles/.osr-sync-all.json'
            },
            product: {
                clean: true,
                debug: true,
                verbose: true,
                root: '${PRODUCT_ROOT}/products',
                src: [
                    "${PRODUCT_ROOT}/products/injection/myriad-spring"
                ],
                target: '${OSR_ROOT}/osr-machines/',
                profile: '${OSR_ROOT}/osr-commons/profiles/.osr-sync-public.json'
            }
        },
        git: {
            test: {
                clean: true,
                debug: true,
                verbose: true,
                cwd: '${OSR_ROOT}/osr-machines/',
                rel: "injection/katbot",
                // message: "Updating ..."
            }
        },
        laser2: {
            test: {
                src: ["./tests/cas"],
                options: {
                    module: 'osr-tasks-test-laser',
                    logLevel: 'debug'
                }
            },
            katbot: {
                src: ["./tests/katbot"],
                options: {
                    module: 'osr-tasks-test-laser'
                }
            },
        },
        cad: {
            all: {
                src: ["./tests/cad/**/*Global*.+(SLDASM)"],
                output: '${SRC_DIR}/${SRC_NAME}.+(json|html|step|x_t)'
            },
            json: {
                src: ["./tests/cad/**/*Global*.+(SLDASM)"],
                output: '${SRC_DIR}/${SRC_NAME}.+(json)'
            },
            myriad: {
                src: ["${PRODUCT_ROOT}/products/injection/myriad-spring/**/*Global*.+(SLDASM)"],
                output: '${SRC_DIR}/${SRC_NAME}.+(json|html|step|x_t)'
            },
            katbot: {
                src: ["${PRODUCT_ROOT}/products/injection/katbot/cad/*Global*.+(SLDASM)"],
                output: '${SRC_DIR}/${SRC_NAME}.+(json)'
            },
            json2: {
                src: ["./tests/cad/**/*Global*.+(SLDASM)"],
                output: '${SRC_DIR}/${SRC_NAME}.+(json)'
            },
            html: {
                output: '${SRC_DIR}/${SRC_NAME}.+(html)',
                src: "./tests/cad/drive/Global*.+(SLDASM)",
                options: {
                    debug: true,
                    verbose: true,
                    onNode: (data => {
                        logger.info(`Converted ${data.src} to ${data.target}`)
                        //debugger
                    })
                }
            },
            step: {
                src: ["./tests/cad/**/*Global*.+(SLDASM)"],
                output: '${SRC_DIR}/${SRC_NAME}.+(step)'
            },
            bom: {
                src: ["./tests/cad/**/*Global*.+(SLDASM)"],
                output: '${SRC_DIR}/${SRC_NAME}.+(xlsx)'
            }
        },
        'images-resize': {
            test: {
                src: ["./tests/media/*.+(jpg)"],
                dst: '${SRC_DIR}/out/${SRC_NAME}.+(webp)'
            }
        },
        i18n: {
            test_multi: {
                src: [
                    "./tests/i18n/specs-en.xlsx"
                ],
                options: {
                    dstLang: 'FR,ES,IT,DE',
                    noCache: true,
                    srcLang: 'EN',
                    query: '$[*][0,1]',
                    debug: false,
                    logLevel: 'info',
                    dst: './tests/i18n/out/${SRC_NAME-0}-${DST_LANG}.xlsx',
                    store: "${OSR_ROOT}/i18n-store/${DST_LANG}/store.json"
                }
            }
        }
    });

    grunt.loadNpmTasks("grunt-extend-config")

    grunt.registerTask('sync-all', [
        'sync:product'
    ]);

    grunt.registerTask('cad-all', [
        'cad:html',
        'cad:json'
    ]);

    grunt.registerTask('default', [
        'compile:newsletter'
    ]);

    grunt.registerTask('media', [
        'images-resize:test'
    ]);

    require('./index').initConfig(grunt, {})
}

module.exports = grunt