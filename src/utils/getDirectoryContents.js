const { promisify } = require("util");
const { resolve } = require("path");
const fs = require("fs");
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

async function getDirectoryContents(dir) {
  const subdirs = await readdir(dir);
  const files = await Promise.all(
    subdirs.map(async subdir => {
      const res = resolve(dir, subdir);
      if (
        res
          .split("/")
          .pop()
          .match(/^\./)
      ) {
        return "";
      }
      return (await stat(res)).isDirectory()
        ? getDirectoryContents(res).then(contents => [res].concat(contents))
        : res;
    })
  );
  return files.reduce((a, f) => a.concat(f), []);
}

exports.getDirectoryContents = getDirectoryContents;
