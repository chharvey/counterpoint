# Counterpoint Configuration
This chapter describes the ways in which Counterpoint developers can configure their programs and compilers.



## Configuration Setup
A configuration file is the best way to manage configuration of your compiler instance.
It’s best to check-in your configuration file into source control.
Your configuration file must be a JSON file, and
it should be at the top level of your codebase, named `counterpoint-config.json`.
*Note: The filename doesn’t matter for now, but in the future this could be a convention. Check back here for updates.*
Your JSON file should be a single object, with two optional properties: `languageFeatures` and `compilerOptions`.
[Counterpoint API coming soon]

- Without a config file, the Counterpoint compiler will use the configuration default values, listed in the next section.
- To use a config file during compilation, you must specify it on the command line. Run `npx cplc --help` for details.
- Even with a config file, you may override it with per-option CLI arguments. Run `npx cplc --config` for details.

For example, the default value of an option `‹foo›` might be `true`.
If in your `counterpoint-config.json` you have `{"languageFeatures": {"foo": false}}`,
that would override the default. However, if you run
```shell
$ npx cplc c ./my-program.cpls -p=./counterpoint-config.json --foo
```
the `--foo` option would override your config file.



## Configuration Options


### `languageFeatures`
Language features are aspects of the Counterpoint Programming Language that may be enabled and disabled at will.


### `compilerOptions`
Compiler options control how source code is compiled into assembly code.
