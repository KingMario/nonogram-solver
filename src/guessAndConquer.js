const assert = require("assert");

const Puzzle = require('./Puzzle');

const { recursionDepth: maxRecursionLevel, debugMode } = require('commander');

/**
 * Run trial and error iteration
 * @param {Strategy} strategy The strategy to use
 * @param {Puzzle} puzzle The puzzle to solve
 * @param {boolean} randomize As above
 * @param {number} currentRecursionLevel (internal) keep track of recursion depth
 */
const guessAndConquer = (strategy, puzzle, randomize, currentRecursionLevel = 0) => {
  const maxGuessCount = 100;
  if (puzzle.isFinished) {
    return puzzle.isSolved ? puzzle : null;
  }
  let snapshot = puzzle.snapshot;
  // find unsolved cells
  let zeroIndexes = snapshot.reduce((result, x, i) => {
    if (x === 0) {
      result.push(i);
    }
    return result;
  }, []);

  assert(zeroIndexes.length > 0, 'Contradiction in trial and error');

  for (let i = 0;  i < maxGuessCount && zeroIndexes.length; i++) {
    let index;
    if (randomize) {
      let random = Math.floor(Math.random() * zeroIndexes.length);
      index = zeroIndexes.splice(random, 1)[0];
    } else {
      index = zeroIndexes.shift();
    }
    // try and set the `index`th cell to 1, and create a new Puzzle from that
    snapshot[index] = 1;
    let trial = new Puzzle({
      rows: puzzle.rowHints.slice(),
      columns: puzzle.columnHints.slice(),
      content: snapshot
    });
    if (debugMode) {
      console.log(`*********************************************************`);
      console.log(`Using trialAndError method on ${i}. zero (index ${index})`);
      console.log(`*********************************************************`);
    }
    // solve the trial puzzle
    try {
      strategy.solve(trial, false); // may throw an exception on contradiction
      if (trial.isFinished) {
        if (!trial.isSolved) {
          // This is a contradiction
          throw new Error('Not a solution');
        }
        if (debugMode) {
          console.log(`Successfully guessed square ${index}=1`);
        }
        // We found a solution by guessing.
        return trial;
      }
      // No progress
      if (currentRecursionLevel >= maxRecursionLevel) {
        // reset and just try the next index
        snapshot[index] = 0;
        continue;
      }
      // try recursion
      let anotherTry = new Puzzle({
        rows: trial.rowHints,
        columns: trial.columnHints,
        content: snapshot
      });
      if (debugMode) {
        console.log(`>>> Recursing to level ${currentRecursionLevel + 1}`);
      }
      let result = guessAndConquer(strategy, anotherTry, randomize, currentRecursionLevel + 1);
      if (debugMode) {
        console.log(`<<< Done recursing level ${currentRecursionLevel + 1}`);
      }
      if (result) {
        if (debugMode) {
          console.log(`[${currentRecursionLevel}] Successfully guessed square ${index}=1`);
        }
        return result;
      }
      // reset and just try the next index
      snapshot[index] = 0;
    } catch (e) {
      // A contradiction has occurred, which means we can be sure that `index`th cell is empty
      if (debugMode) {
        console.log(`[${currentRecursionLevel}] Successfully guessed square ${index}=-1 by contradiction`);
      }
      snapshot[index] = -1;
    }
  }
  return null;
};

module.exports = guessAndConquer;
