let isBottom = false;
// just to make sure it is at top...
$('html, body').animate({scrollTop: 0}, 'slow');

$('.sidebar .menu-button').click((e)=>{
  let $sidebar = $(e.target).closest('.sidebar');
  $sidebar.toggleClass('active');
  if(isBottom){
    $('html, body').animate({scrollTop: 0}, 'slow');
    isBottom = false;
  }
  else{
    $('html, body').animate({scrollTop: $(document).height()}, 'slow');
    isBottom = true;
  }
});



const $window = $(window);

$window.scroll(function() {
   if($window.scrollTop() + $window.height() > $(document).height()-1) {
     $('.sidebar').addClass('active');
   }
   else{
     $('.sidebar').removeClass('active');
   }
});

// -------------------------------
// add or remove geocoder when resized or is small screen
function addGeocoder(windowWidth){
  if(windowWidth < 992){
    // console.log('helo', windowWidth)
    $('.mapboxgl-ctrl-top-right').empty();
    map.addControl(geocoder);
  }
  else{
    $('.geocoder').empty();
    document.getElementById('geocoder').appendChild(geocoder.onAdd(map));
  }
}
$window.resize(()=>{
  addGeocoder($window.width());
})


// -------------------------------
// document ready stuff
$(document).ready(()=>{
  addGeocoder($window.width());
})
