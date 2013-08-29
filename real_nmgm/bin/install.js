;
(function(module) {
  var colors = require("colors");
  var fs = require("fs");
  var spawn = require("child_process").spawn;
  var asyncblock = require("asyncblock");
  var _ = require("lodash");

  colors.setTheme({
    error: 'red'
  });
  
  function getUserHome() {
    return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
  }
  
  function logError(str) {
    console.error(colors.error(str));
  }  
  
  var user_home = getUserHome();
  var user_home_bin = user_home + "/bin";
  var nmgm_home = user_home_bin + "/.nmgm";
  function install(module) {
    var module_home = nmgm_home + "/" + module;
    var module_location = module_home + "/node_modules/" + module;
    try {
      fs.lstatSync(module_home);
    } catch (error) {
      try {
        fs.mkdirSync(module_home);
      } catch (error) {
        logError("ERROR: could not mkdir " + module_home + ". Aborting.");
        console.error(error);
        process.exit(1);
      }
    }
    
    var npm = spawn("npm", ["install", module, "--no-bin-links"], { cwd: module_home, customFds: [-1,1,2] });
    
    npm.on("close", function(code) {
      if (code != 0) {
        process.exit(code);
      } else {
        function read_package_json(callback) {
          asyncblock(function(flow) {
            fs.readFile(module_location + "/package.json", "utf8", flow.add());
            return flow.wait();
          }, callback);
        }
        
        read_package_json(function(error, contents) {
          if (error) {
            logError("ERROR: cannot read " + module_location + "/package.json. Aborting");
            console.error(error);
            process.exit(1);
          } else {
            var package_json = JSON.parse(contents);
            var bins = package_json["bin"];
            
            if (bins) {
              var keys = _.keys(bins);
              _(keys).forEach(function(key) {
                var command = bins[key];
                var command_location = module_location + "/" + command;
                var destination = user_home_bin + "/" + key;
                
                try {
                  fs.unlinkSync(destination);
                } catch (error) {
                  // fail quietly, the link probably doesn't exist
                }
                
                try {
                  fs.chmodSync(command_location, "0755");
                } catch (error) {
                  logError("ERROR: cannot chmod 0755 " + command_location + ". Aborting.");
                  console.error(error);
                  process.exit(1);
                }
                 
                try {
                  fs.symlinkSync(command_location, destination);
                } catch (error) {
                  logError("ERROR: cannot create symlink from " + command_location + " to " + destination + ". Aborting.");
                  console.error(error);
                  process.exit(1);
                }
              });
            }
          }
        });
      }
    });
  }
  
  module.exports = install;
})(module);
