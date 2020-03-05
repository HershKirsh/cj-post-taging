htmlElements = {
    allTags: document.getElementById('all-tags'),
    container: document.getElementById('container'),
    posts: document.getElementById('posts'),
    addNewTag: document.getElementById('add-new-tag'),
    newTagInput: document.getElementById('add-tag-input'),
    filteredList: document.getElementById('filtered-list'),
    filterTag: document.getElementById('filter-tag'),
    filteredPosts: document.getElementById('filtered-posts')
}

const tagElements = {
    tags: [],
    tagsString: '',
    prepareTags: function () {
        return new Promise((resolve) => {
            this.tags.forEach(tag => {
                this.tagsString += `<option data-tag="${tag}" value="${tag}">${tag}</option>`
            });
            resolve();
        })
    },
    showAllTags: function () {
        let tagString = ''
        this.tags.forEach(tag => {
            tagString += `<span class="tag" data-tag="${tag}" title="click to see posts with this tag" onclick="postElements.sortPosts('${tag}')">${tag}<span class="remove" title="remove tag" onclick="tagElements.deleteTag(this.parentElement, '${tag}')">&#10006;</span></span>`
        });
        htmlElements.allTags.innerHTML = tagString;
    },
    addTag: function (select, value, i) {
        if (value === "new") {
            htmlElements.addNewTag.style.display = "flex";
            htmlElements.newTagInput.focus();
        } else {
            postElements.postList[i].tags.push(value);
            postElements.postList[i].element.querySelector(`select option[value="${value}"]`).hidden = true;
            const addedTag = document.createElement('span');
            addedTag.classList.add('tag')
            addedTag.title = "click to see posts with this tag";
            addedTag.onclick = `postElements.sortPosts('${value}')`;
            addedTag.dataset.tag = value;
            const innerString = `${value}<span class="remove" title="remove tag" onclick="tagElements.removeTag(this.parentElement, '${value}', ${i})">&#10006;</span>`
            addedTag.innerHTML = innerString;
            postElements.postList[i].element.querySelector(`.tags`).insertAdjacentElement('beforeend', addedTag);
            postElements.postList[i].changed = true;
        }
        select.value = 'Add tags';
    },
    addNewTag: function () {
        if (htmlElements.newTagInput.value !== "") {
            const newTags = htmlElements.newTagInput.value.split(/ ?, ?/);
            let tagString = "";
            postElements.postList.forEach(item => {
                newTags.forEach(tag => {
                    const newOption = document.createElement('option');
                    newOption.setAttribute("value", tag);
                    newOption.dataset.tag = tag
                    newOption.innerText = tag;
                    const optionNew = item.element.querySelector('option[value="new"');
                    item.element.querySelector('select').insertBefore(newOption, optionNew)
                });
            });
            newTags.forEach(tag => {
                tagString += `<span class="tag" data-tag="${tag}" title="click to see posts with this tag" onclick="postElements.sortPosts('${tag}')">${tag}<span class="remove" title="remove tag" onclick="tagElements.deleteTag(this.parentElement, '${tag}')">&#10006;</span></span>`
            });
            htmlElements.allTags.innerHTML += tagString;
            this.tags = [...this.tags, ...newTags];
            htmlElements.newTagInput.value = "";
            htmlElements.addNewTag.style.display = "none";
        }
        sendData('/tags', 'PATCH', this.tags);
    },
    removeTag: function (tagElem, tagName, i) {
        tagElem.remove();
        const tagIndex = postElements.postList[i].tags.indexOf(tagName);
        if (tagIndex > -1) postElements.postList[i].tags.splice(tagIndex, 1);
        postElements.postList[i].element.querySelector(`option[value="${tagName}"`).hidden = false;
        postElements.postList[i].changed = true;
    },
    deleteTag: function (tagElem, tagName) {
        if (confirm("Are you sure you want to delete this tag. \nThis will also remove this tag from any post it's been assigned to.")) {
            tagElem.remove();
            const tagIndex = this.tags.indexOf(tagName);
            if (tagIndex > -1) this.tags.splice(tagIndex, 1);
            postElements.postList.forEach(item => {
                const tagI = item.tags.indexOf(tagName);
                if (tagI > -1) item.tags.splice(tagI, 1);
                item.changed = true;
            });
            document.querySelectorAll(`[data-tag="${tagName}"]`).forEach(element => element.remove());
            sendData('/tags', 'PATCH', this.tags);
        }
    }
}

const postElements = {
    postList: [],
    removeOptions: function () {
        this.postList.forEach(post => {
            if (post.tags.length > 0) {
                post.tags.forEach(tag => {
                    post.element.querySelector(`option[value=${tag}]`).hidden = true;
                })
            }
        })
    },
    sortPosts: function (tagName) {
        htmlElements.filteredPosts.innerHTML = "";
        let newArray = this.postList.filter(item => item.tags.includes(tagName));
        if (newArray.length > 0) {
            newArray.forEach(item => {
                const newElem = item.element.cloneNode(true)
                htmlElements.filteredPosts.appendChild(newElem);
            })
            htmlElements.filterTag.innerText = tagName;
            htmlElements.filteredList.style.display = 'flex';
        }
    }
};

function getData(url, method) {
    return new Promise((resolve) => {
        fetch('https://conscious-j.herokuapp.com/posts' + url, { method: method })
            .then(res => {
                return res.json();
            })
            .then(data => {
                resolve(data);
            })
    })
};

function sendData(url, method, body) {
    return new Promise((resolve, reject) => {
        fetch('https://conscious-j.herokuapp.com/posts' + url, {
            method: method,
            body: JSON.stringify(body),
            headers: {
                "Content-type": "application/json"
            }
        })
            .then(res => res.json())
            .then(res => resolve(res.message))
            .catch(err => reject(err))
    })
}


async function init() {
    tagElements.tags = await getData('/tags', 'GET');
    postElements.postList = await getData('', 'GET');
    await tagElements.prepareTags();
    await appendData(postElements.postList);
    tagElements.showAllTags();
    postElements.removeOptions();
};

function appendData(data) {
    return new Promise((resolve) => {
        data.forEach((post, i) => {
            const newElement = document.createElement('div');
            newElement.classList.add('post');
            let tagsHtml = '';
            if (post.tags.length > 0) {
                for (let x = 0; x < post.tags.length; x++) {
                    tagsHtml += `<span class="tag" data-tag="${post.tags[x]}" title="click to see posts with this tag" onclick="postElements.sortPosts('${post.tags[x]}')"> ${post.tags[x]}<span class="remove" title="remove tag" onclick="tagElements.removeTag(this.parentElement, '${post.tags[x]}', ${i})">&#10006;</span></span>`;
                }
            }
            const textNode = `<img src="./assets/${post.name}" alt="post ${i}" tabindex="0">
            <div class="tags">${tagsHtml}</div>
            <select name="tags" onchange="tagElements.addTag(this, this.value, ${i})">
                <option disabled selected hidden>Add tags</option>
                ${tagElements.tagsString}
                <option value="new">Add new tag</option>
            </select>`;
            newElement.innerHTML = textNode;
            htmlElements.posts.insertAdjacentElement('beforeend', newElement);
            post.element = newElement;
        });
        resolve();
    })
};

async function submitChanges() {
    const changedPosts = postElements.postList.filter(item => item.changed);
    if (changedPosts.length > 0) {
        alert(await sendData('', 'PATCH', changedPosts));
    }
}

init();
