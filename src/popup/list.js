// JS that can be executed while the popup is displayed

document.querySelector( '.authentication button' ).addEventListener( 'click', function() {
  chrome.runtime.sendMessage('authenticate');
});

setUI = function() {
  isAuthenticated().then( function( access_token ) {
    document.querySelector( '.authentication' ).style.display = 'none';
    document.querySelector( '.authenticated'  ).style.display = 'block';
  }, function( error ) {
    document.querySelector( '.authentication' ).style.display = 'block';
    document.querySelector( '.authenticated'  ).style.display = 'none';
  });
}

setUI();
