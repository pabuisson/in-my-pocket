"use strict";

var Items = ( function() {
  function matchQuery( item, query ) {
    const lowerQuery = query.toLowerCase()
    const lowerTitle   = ( item.resolved_title || '' ).toLowerCase();
    const lowerUrl     = ( item.resolved_url   || '' ).toLowerCase();

    return lowerTitle.includes( lowerQuery ) || lowerUrl.includes( lowerQuery );
  }


  return {
    filter: function( items, query ) {
      let sortedItems   = items.sort( ( a, b ) => a.created_at < b.created_at );
      let filteredItems = undefined;

      if( query == '' || !query ) {
        filteredItems = sortedItems;
      } else {
        filteredItems = sortedItems.filter( ( item ) => matchQuery( item, query ) );
      }

      return filteredItems;
    }
  }
})();

export default Items;
