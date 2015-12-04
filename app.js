//==============================================================================
// Helper Functions


function get_column_count(){
    return $('.markdown-body table.csv-data thead th').length;
}


/*
 * Convert a tr DOM element to an array of values.
 * Notice: Non-numerical values are converted to null.
 */
function table_row_2_array_of_numeric_values(tr){
  var values = [];

  $(tr).find('td:not(.blob-num)').each(function(){
    var value = $(this).text().trim();

    if(value == ''){
      value = null;
    } else {
      value = Number(value);
    }

    values.push(isNaN(value) ? null : value);
  });

  return values;
}


/*
 * Return the values in the table as an array of arrays.
 * Each inner array is the values in a single row.
 * Notice: Non-numerical values are converted to null.
 */
function load_csv_column_values(){
    var columns = [];

    for(var i=0; i < get_column_count(); i++){ columns.push([]);}

    $('.markdown-body table.csv-data tbody .js-file-line:visible').each(function() {
      var row_values = table_row_2_array_of_numeric_values(this);
      for(var i=0; i < row_values.length; i++){
        if(row_values[i] !== null){
          columns[i].push(row_values[i]);
        }
      }
    });

    return columns;
}


/*
 * columns - Array of arrays. Each inner array represents a column of data.
 * aggregate_column - A function that takes a non-empty array of values, and returns
 *                    A single value.
 */
function aggregate_columns(columns, aggregate_column){
  var aggregated_values = [];

  for (var i = 0; i < columns.length; i++) {
    if(columns[i].length == 0){
      aggregated_values.push(null);
    } else {
      aggregated_values.push(aggregate_column(columns[i]));
    }
  }

  return aggregated_values;
}



function prepend_row(label, values){
  var tr = $('<tr class="csv-stats-line"></tr>');
  tr.append('<td class="blob-num js-line-number">' + label + '</td>');

  for (var i = 0; i < values.length; i++) {
    var value = values[i];
    // If the value is a floating point number, limit to 2 decimal digits
    if (value && (value % 1 !== 0)){
      value = value.toFixed(2);
    }

    tr.append('<td class="csv-aggregation">' + (value === null ? ' ' : value) + '</td>');
  }

  $('.markdown-body table.csv-data tbody').prepend(tr);
}


//==============================================================================
// Map text-labels to aggregation functions


var aggregations = {
  'COUNT' : function(column){
    return column.length;
  },

  'AVG' : function(column){
    return (column.reduce(function(x, y) { return x + y; })) / column.length;
  },

  'MEDIAN' : function(column){
    var copy = column.concat();
    copy.sort(function(a,b) { return a - b; });
    return copy[Math.floor(copy.length / 2)];
  },

  'MIN' : function(column){
    return column.reduce(function(x, y) { return x < y ? x : y; });
  },

  'MAX' : function(column){
    return column.reduce(function(x, y) { return x > y ? x : y; });
  }
}


//==============================================================================
// The actual script ...

function run(){
  var columns = load_csv_column_values();

  $('.csv-stats-line').remove();

  // If all columns are empty (i.e. no data), don't do anything
  if (columns.reduce(function(c1, c2) { return c1.length + c2.length; }) == 0){
    return;
  }

  for (var label in aggregations) {
    if (aggregations.hasOwnProperty(label)) {
      prepend_row(label, aggregate_columns(columns, aggregations[label]));
    }
  }
}



run();

// A hack ...
// Every time someone hanges the filter value (above the CSV table),
// give GitHub 50 ms to filter the CSV data, and then refresh the stats
$('input.blob-filter').keyup(function(){
  setTimeout(run, 50);
});
