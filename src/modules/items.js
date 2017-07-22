"use strict";

var Items = ( function() {
  let _loaded  = false;

  function matchQuery( item, query ) {
    let title = item.resolved_title.toLowerCase() || '';
    let url   = item.resolved_url.toLowerCase()   || '';

    return title.includes( query.toLowerCase() ) || url.includes( query.toLowerCase() );
  }


  return {
    filter: function( items, query ) {
      let sortedItems   = items.sort( ( a, b ) => { return a.created_at < b.created_at; } );
      let filteredItems = undefined;

      if( query == '' || !query ) {
        filteredItems = sortedItems;
      } else {
        filteredItems = sortedItems.filter( ( item ) => {
          return matchQuery( item, query );
        });
      }

      return filteredItems;
    }
  }
})();

export default Items;
