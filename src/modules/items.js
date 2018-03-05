"use strict";

import Logger from './logger.js';

var Items = ( function() {
  function matchQuery( item, query ) {
    const lowerQuery = query.toLowerCase();
    const lowerTitle   = ( item.resolved_title || '' ).toLowerCase();
    const lowerUrl     = ( item.resolved_url   || '' ).toLowerCase();

    // TODO: do not search on the protocol

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
    },

    paginate: function( items, page, perPage ) {
      if( !perPage || items.length == 0 ) {
        return items;
      }

      const itemsCount   = items.length;
      const pagesCount   = Math.ceil( itemsCount / perPage );
      // FIXME: I sort the items twice: here in paginate, and above in filter
      let sortedItems    = items.sort( ( a, b ) => a.created_at < b.created_at );

      if( page <= 0 || page > pagesCount ) {
        Logger.warn( `Could not get page ${ page } (${ itemsCount } items, asked ${ perPage } per page)` );
      } else {
        const fromIndex = ( page - 1 ) * perPage;
        const toIndex   = ( page * perPage ) - 1;

        return sortedItems.slice( fromIndex, toIndex + 1 );
      }
    }
  }
})();

export default Items;
