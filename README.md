# solid
A robust programming language.

Read the [documentation] (link pending) on what Solid is and what it can do.
To start coding in Solid, follow the guide below.



## Code in Solid
The first step is to make sure you have `node` and `npm` installed.
Go to https://nodejs.org/en/ and download the **LTS (“Recommended For Most Users”)** version.
This will install both tools.

Since this project is still in pre-release, it’s not fully stable or published to a registry yet.
Until it reaches v1.0.0, you’ll need to obtain its source code from GitHub and build it yourself.
If you don’t already have `git` installed, (run `git --version` in your command line to check),
you can download it from https://git-scm.com/.

After installing the requisites, run the following commands in your command line:
```shell
$ git clone https://github.com/chharvey/solid.git
$ cd ./solid/
$ npm ci && npm run build
```

To be sure it installed correctly, run this command to see the current version of `solid`:
```shell
$ npx solid --version # you should see:
> solid version 0.1.0
```

Now you’re ready to start coding!
Open a new text file and enter the following source code:
```
1 + +2 ^ (5 - 3) * -4
```
Then save the file under `./sample/my-program.solid` within the project directory.

*In its current version, Solid is a simple calculator that allows only numbers and operators.
Of course, the plan is for it to become a fully-functional programming language.
You can follow its progression on [GitHub](https://github.com/chharvey/solid/milestones) for details.*

Once you save your source code, you can compile and execute it from the command line.
Make sure your current working directory is the `./solid/` project directory as shown above
(for now, you’ll need to be in this directory to run the compiler),
and then run the following commands:
```shell
$ npx solid c ./sample/my-program.solid
$ npx solid r ./sample/my-program.wasm
```
The first line compiles your source code into an executable binary format,
and the second line runs that executable.
For a full description of what the `solid` command-line interface can do, run `npx solid --help`.

That’s it! You should see `-15` in the output,
which is the result of evaluating the expression.
Play around with the expression to change its value.
