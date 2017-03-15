Recently, I was working on a command-line application to manage the data acquisition process for a scientific study.  The app performs a bunch of disparate tasks that require libraries for: 

+ handling subject registration via a local webserver supporting OAuth2 Authorization Code Grant Flow
+ importing a FitBit library for querying FitBit's API
+ reading from and writing to a local database
+ async control flow
+ date and time manipulation and formatting

As I moved toward completion of the project and the sub-command modules grew in size and complexity, I noticed that the load time increased to the point where, on my 2010 macbook (I know, it's old), it was taking about 7 to 8 seconds to just display the help screen. I was able to reduce the raw load time to less than a second without too much effort and I'd like to share a little bit about how I did that. 

## The Interface

The cli app has a standard sub-command structure: 

    cmd sub-cmd [ arguments ... ] [ options ... ]

The sub-commands are where the main functionality is. The app exposes four of them:

    cmd register
    cmd query <name> <date-range>
    cmd stats
    cmd update

## Choosing a Command Parsing Library

I needed a library to parse the command input and I decided to use [commander.js](https://github.com/tj/commander.js). It's a straightforward and fairly transparent library for building simple to moderately complex command-line interfaces. The library was written by Tj Holowaychuk, the author of Express. 

## Modularity Only Gets You Half Way There

Wanting to keep this application modular for testing, I broke the functionality into modules (one per sub-command) which were comprised of many sub-modules. Below is the entry point that is executed when the cli app is run on the command line. There I pull in modules for each sub-command, register them on the `commander` app object as callbacks for their respective sub-commands, and then I call the parser to parse the command-line input and call the appropriate callback.

Here is what my initial `index.js` looked like when it took 8 seconds to load: 

    const cli = require('commander');
    const { 

        register,   
        query, 
        stats, 
        update 

    } = require('./commands');

    cli
        .command('register')
        .description('register subject for study.')
        .action(register);

    cli
        .command('query <subject_id>')
        .description('query data for subject.')
        .action(query);

    cli
        .command('stats')
        .description('show study statistics.')
        .action(stats);

    cli
        .command('update')
        .description('pull in new changes to the app')
        .action(update);

    cli.parse(process.argv);

## I'm Loading Everything Every Time

The problem is simply that in `index.js`, I'm pulling in the dependencies for the entire application and loading them all synchronously before parsing the command. And while the OS caches recently loaded modules, bringing subsequent invocations of the utility down to just a few hundred milliseconds, the utility would be used usually once per session and sporadically, negating the benefits of the cache.  So in the average use case the performance was ... *bad*.

## Loading Just the Libraries You Need

In order to cut the load time down, I decided to restrict the loading of dependencies to just those required by the sub-command being executed. This comes down to shifting the scope and timing of the `require` call so that it is performed as part of the callback associated with a single command rather than on the execution of the top level `index.js` entry-point file for every command. I should note that `commander` supports git-style sub-commands, but I found that that design didn't fit my needs for two reasons:

1) The sub-command files need to follow a specific naming and location convention in order for `commander` to execute them. If the command is `cmd subcmd`, then there needs to be an executable file named `cmd-subcmd.js` in the directory where `cmd.js` is located. 

2) The subcommand module is `exec`'ed by Node and thus needs to take the form of a script, not a module. I needed my sub-command files to take the form as a module for testing purposes.

Neither of these are truly shortcomings, but I felt that it was easy enough to work lazy sub-commands into my project  with a few lines of code.

I ended up writing a utility function like this:

    // pass the dependency name in
    function delayedRequire(depName) {

        // return a function that requires that dependency 
        return function() {
            require(`./${ depName }`);
        }

    }

That solves the lazy-loading issue. Now instead of registering the submodule command directly with commander (which requires all submodules and their dependencies to be imported first), I register the result of the `delayedRequire` function call, which produces a callback that performs the dependency `require`:

    // if the user runs 'cmd stats' on the command line, then just the stats module is loaded
    cli
        .command('stats')
        .description('gets stats')
        // calling delayedRequire first, returning a function that requires the stats module
        .command( delayedRequire('stats') );

Again, I've shifted the scope and timing of the `require` call from the top-level `index.js` to the callback specified by the already parsed command-line input.

## Handling The Arguments 

The final issue to resolve was the arguments that are passed from `commander` app object to the corresponding callback. Since the new function both requires the sub-command module and calls it, we need to pass the arguments to the callback function into the sub-module manually.

    // es5 way
    function delayedRequire(depName) {
        
        return function() {
            const entryPoint = require(`./commands/${ depName }`);
            entryPoint.apply(null, arguments);
        };

    }

    // the es2015 way
    function delayedRequire(depName) {
        
        return function(...args) {

            const entryPoint = require(`./commands/${ depName }`);
            entryPoint(...args);

        };

    }

    // the succinct es2015 way
    const delayedRequire = (depName) => (...args) => require(`./commands/${ depName }`)(..args);

Here's a more complete version of what I came up with. Notice that the syntax for the `commander` callback registration is basically the same as it was in the beginning:

    const cli = require('commander');
    const basepath = './commands';
    const makeLoader = function(name) {

        return function(...args) {

            let entryPoint = require(`${basepath}/${name}`);
            entryPoint.(...args);

        };

    };

    // build an object of loaders from an array of module names
    // destructure the result into module bindings.
    const { 

        register, 
        query, 
        stats, 
        update 

    } = [ 

        'register', 
        'query', 
        'stats', 
        'update' 

    ].reduce((o, dep) => {

       o[dep] = makeLoader(dep);
       return o;

    }, {});

    cli
        .command('register')
        .description('register subject for study.')
        .action(register);

    cli
        .command('query <subject_id>')
        .description('query data for subject.')
        .action(query);

    cli
        .command('stats')
        .description('show study statistics.')
        .action(stats);

    cli
        .command('update')
        .description('pull in new changes to the app')
        .action(update);

    cli.parse(process.argv);
