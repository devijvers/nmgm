#!/usr/bin/env node

var fs = require("fs");
var child_process = require("child_process");
var exec = child_process.exec;
var spawn = child_process.spawn;

function getUserHome() {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

var user_home_bin = getUserHome() + "/bin";
try {
  fs.lstatSync(user_home_bin);
} catch (error) {
  try {
    fs.mkdirSync(user_home_bin);
  } catch (error) {
    console.error("ERROR: mkdir of " + user_home_bin + " failed. Aborting.");
    console.error(error);
    process.exit(1);
  }
}

var temp_exec_script_name = "__test_script" + (process.platform == 'win32' ? ".cmd" : "");
var temp_exec_script = user_home_bin + "/" + temp_exec_script_name;
try {
  var content = process.platform == 'win32' ? "@echo off\necho Hello\n" : "#!/bin/sh\necho Hello\n";
  fs.writeFileSync(temp_exec_script, content, { mode: "0755" });
} catch (error) {
  console.error("ERROR: writing to " + temp_exec_script + " failed. Aborting.");
  console.error(error);
  removeFile(temp_exec_script);
  process.exit(2);
}

exec(temp_exec_script_name, {}, after_test_script_exec);

function after_test_script_exec(error, stdout, stderr) {
  if (error) {
    console.error("ERROR: could not execute the test script. Aborting.");
    console.error(error);
    console.log(">>>>> QUESTION: is " + user_home_bin + " in the " + (process.platform == 'win32' ? "%PATH%" : "$PATH") + "?");
    removeFile(temp_exec_script);
    process.exit(4);
  }
  
  removeFile(temp_exec_script);
  var nmgm_dir = user_home_bin + "/.nmgm";
  
  try {
    fs.mkdirSync(nmgm_dir);
  } catch (error) {
    console.error("ERROR: could not mkdir " + nmgm_dir + ". Aborting.");
    console.error(error);
    process.exit(5);
  }

  try {
    fs.mkdirSync(nmgm_dir + "/nmgm");
  } catch (error) {
    console.error("ERROR: could not mkdir " + nmgm_dir + "/nmgm. Aborting.");
    console.error(error);
    process.exit(6);
  }

  
  var npm = spawn("npm", ["install", __dirname + "/real_nmgm/"], { cwd: nmgm_dir + "/nmgm", customFds: [-1,1,2] });
  
  npm.on("close", function(code) {
    if (code != 0) {
      process.exit(code);
    } else {
      if (process.platform != 'win32') {
        try {
          fs.symlinkSync(nmgm_dir + "/nmgn/bin/nmgm", user_home_bin + "/nmgm");
        } catch (error) {
          console.error("ERROR: could not create symlink from " + nmgm_dir + "/nmgn/bin/nmgm to " + user_home_bin + "/nmgm. Aborting.");
          console.error(error);
          process.exit(7);
        } 
      } else {
        console.error("ERROR: win32 not supported for now. Aborting.");
        process.exit(7);
      }
    }
  });
}

function removeFile(path) {
  try {
    fs.unlinkSync(path);
  } catch (error) {
    console.log("WARNING: could not delete " + path);
    console.log(error);
  }
}
