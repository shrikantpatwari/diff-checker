const express = require('express');
const path = require('path');
const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Advanced diff algorithm similar to git diff
function diff(text1, text2) {
  const lines1 = text1.split('\n');
  const lines2 = text2.split('\n');
  
  // Build LCS table
  const m = lines1.length;
  const n = lines2.length;
  const lcs = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (lines1[i - 1] === lines2[j - 1]) {
        lcs[i][j] = lcs[i - 1][j - 1] + 1;
      } else {
        lcs[i][j] = Math.max(lcs[i - 1][j], lcs[i][j - 1]);
      }
    }
  }
  
  // Backtrack to build aligned diff
  const result = [];
  let i = m, j = n;
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && lines1[i - 1] === lines2[j - 1]) {
      result.unshift({ 
        type: 'equal', 
        left: lines1[i - 1], 
        right: lines2[j - 1], 
        leftLine: i, 
        rightLine: j 
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
      result.unshift({ 
        type: 'added', 
        left: null, 
        right: lines2[j - 1], 
        leftLine: null, 
        rightLine: j 
      });
      j--;
    } else if (i > 0 && (j === 0 || lcs[i][j - 1] < lcs[i - 1][j])) {
      result.unshift({ 
        type: 'deleted', 
        left: lines1[i - 1], 
        right: null, 
        leftLine: i, 
        rightLine: null 
      });
      i--;
    }
  }
  
  // Group changes into hunks (like git diff)
  const hunks = [];
  let currentHunk = null;
  const contextLines = 3;
  
  result.forEach((line, idx) => {
    if (line.type !== 'equal') {
      // Start a new hunk or extend current one
      if (!currentHunk) {
        const start = Math.max(0, idx - contextLines);
        currentHunk = {
          leftStart: result[start].leftLine || 0,
          rightStart: result[start].rightLine || 0,
          lines: result.slice(start, idx + 1)
        };
      } else {
        currentHunk.lines.push(line);
      }
    } else if (currentHunk) {
      // Add context after changes
      currentHunk.lines.push(line);
      
      // Check if we should close this hunk
      let unchangedCount = 0;
      for (let k = currentHunk.lines.length - 1; k >= 0; k--) {
        if (currentHunk.lines[k].type === 'equal') {
          unchangedCount++;
        } else {
          break;
        }
      }
      
      if (unchangedCount > contextLines * 2) {
        // Close hunk, keep only context lines
        currentHunk.lines = currentHunk.lines.slice(0, -(unchangedCount - contextLines));
        hunks.push(currentHunk);
        currentHunk = null;
      }
    }
  });
  
  // Close final hunk if exists
  if (currentHunk) {
    hunks.push(currentHunk);
  }
  
  // Calculate stats
  let added = 0, deleted = 0;
  result.forEach(line => {
    if (line.type === 'added') added++;
    if (line.type === 'deleted') deleted++;
  });
  
  return { hunks, stats: { added, deleted }, fullDiff: result };
}

// Character-level diff for inline changes
function inlineDiff(str1, str2) {
  if (!str1 || !str2) return null;
  
  const words1 = str1.split(/(\s+)/);
  const words2 = str2.split(/(\s+)/);
  
  const m = words1.length;
  const n = words2.length;
  const lcs = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (words1[i - 1] === words2[j - 1]) {
        lcs[i][j] = lcs[i - 1][j - 1] + 1;
      } else {
        lcs[i][j] = Math.max(lcs[i - 1][j], lcs[i][j - 1]);
      }
    }
  }
  
  const result1 = [];
  const result2 = [];
  let i = m, j = n;
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && words1[i - 1] === words2[j - 1]) {
      result1.unshift({ text: words1[i - 1], type: 'equal' });
      result2.unshift({ text: words2[j - 1], type: 'equal' });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
      result2.unshift({ text: words2[j - 1], type: 'added' });
      j--;
    } else if (i > 0) {
      result1.unshift({ text: words1[i - 1], type: 'deleted' });
      i--;
    }
  }
  
  return { left: result1, right: result2 };
}

app.post('/api/diff', (req, res) => {
  const { left, right } = req.body;
  const result = diff(left, right);
  
  // Add inline diffs for modified adjacent lines
  result.hunks.forEach(hunk => {
    for (let i = 0; i < hunk.lines.length - 1; i++) {
      const curr = hunk.lines[i];
      const next = hunk.lines[i + 1];
      
      if (curr.type === 'deleted' && next.type === 'added') {
        const inline = inlineDiff(curr.left, next.right);
        if (inline) {
          curr.inlineDiff = inline.left;
          next.inlineDiff = inline.right;
          curr.isModified = true;
          next.isModified = true;
        }
      }
    }
  });
  
  res.json(result);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
