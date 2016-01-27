var parent = document.getElementById('pAvatars');
parent.addEventListener('click',select,false);
function select (e) {
	function removeSelected (element) {
		element.classList.remove("selected");
	}
	var items = document.getElementsByClassName('avatars');
	for (var i = 0; i < items.length; i++) {
		removeSelected(items[i]);
	};
	
	if (e.target != parent)
	{
		e.target.classList.add("selected");
		var input =document.getElementById("Pimage");
		input.value=e.target.id;

	}
		
}