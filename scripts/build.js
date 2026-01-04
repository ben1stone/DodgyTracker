#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Parse arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node build.js <day> <pot> [totalDays]');
  process.exit(1);
}

const day = parseInt(args[0], 10);
const pot = parseInt(args[1], 10);
const totalDays = args[2] ? parseInt(args[2], 10) : 365;

// Validate inputs
function validate() {
  const errors = [];
  
  if (!Number.isInteger(day) || day < 0) {
    errors.push('day must be a non-negative integer');
  }
  if (!Number.isInteger(pot) || pot < 0) {
    errors.push('pot must be a non-negative integer');
  }
  if (!Number.isInteger(totalDays) || totalDays < 0) {
    errors.push('totalDays must be a non-negative integer');
  }
  if (Number.isInteger(day) && Number.isInteger(totalDays) && day > totalDays) {
    errors.push('day cannot exceed totalDays');
  }
  
  if (errors.length > 0) {
    console.error('Validation errors:');
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }
}

validate();

// Format GBP currency
function formatGBP(value) {
  return '£' + value.toLocaleString('en-GB');
}

// Calculate final pot if fail every remaining day
// pot * 2^(remainingDays) - use BigInt for large numbers
function calculateFailPot(pot, remainingDays) {
  if (pot === 0) {
    return '£0';
  }
  
  if (remainingDays === 0) {
    return formatGBP(pot);
  }
  
  // Use BigInt to handle arbitrarily large numbers
  const result = BigInt(pot) * (2n ** BigInt(remainingDays));
  
  // Format with thousand separators
  const formatted = result.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return `£${formatted}`;
}

// Calculate values
const remainingDays = totalDays - day;
const finalSuccess = pot + 10 * remainingDays;
const finalFail = calculateFailPot(pot, remainingDays);

// Read template
const templatePath = path.join(__dirname, '..', 'template.html');
let template;
try {
  template = fs.readFileSync(templatePath, 'utf-8');
} catch (err) {
  console.error(`Failed to read template: ${err.message}`);
  process.exit(1);
}

// Replace placeholders
const now = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
const output = template
  .replace(/\{\{DAY\}\}/g, day.toString())
  .replace(/\{\{TOTAL_DAYS\}\}/g, totalDays.toString())
  .replace(/\{\{CURRENT_POT\}\}/g, formatGBP(pot))
  .replace(/\{\{FINAL_SUCCESS\}\}/g, formatGBP(finalSuccess))
  .replace(/\{\{FINAL_FAIL\}\}/g, finalFail)
  .replace(/\{\{UPDATED_AT\}\}/g, now);

// Write index.html
const outputPath = path.join(__dirname, '..', 'index.html');
try {
  fs.writeFileSync(outputPath, output, 'utf-8');
  console.log(`Generated ${outputPath}`);
  console.log(`  Day: ${day}/${totalDays}`);
  console.log(`  Current pot: ${formatGBP(pot)}`);
  console.log(`  Final (success): ${formatGBP(finalSuccess)}`);
  console.log(`  Final (fail): ${finalFail}`);
} catch (err) {
  console.error(`Failed to write output: ${err.message}`);
  process.exit(1);
}
