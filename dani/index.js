function onNewItem() {
    const list = document.getElementById('list');
    const input = document.getElementById('textField');
    const item = document.createElement('li');
    item.appendChild(document.createTextNode(input.value));
    list.appendChild(item);
    item.onclick = function() {
        list.removeChild(item);
    }
    input.value = '';
}