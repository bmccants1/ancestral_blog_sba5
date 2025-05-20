let users = JSON.parse(localStorage.getItem("users")) || {
  admin: "phoenix123",
  titan91: "phoenix123",
  monitor1: "phoenix123",
  monitor2: "phoenix123",
  monitor3: "phoenix123"
};


let currentUser = null;
let role = "user";
let editingPostId = null;


if (localStorage.getItem("rememberedUser")) {
  currentUser = localStorage.getItem("rememberedUser");
  role = getRole(currentUser);
  activateSession();
}


function getRole(user) {
  if (["admin", "titan91"].includes(user)) return "admin";
  if (["monitor1", "monitor2", "monitor3"].includes(user)) return "monitor";
  return "user";
}


function activateSession() {
  document.getElementById("postForm").style.display = "flex";
  document.getElementById("authPanel").style.display = "none";
  document.getElementById("logoutPanel").style.display = "block";
  document.getElementById("userDisplay").textContent = currentUser;
}


document.getElementById("loginBtn").onclick = () => {
  const u = document.getElementById("username").value.trim();
  const p = document.getElementById("password").value;
  if (users[u] && users[u] === p) {
    currentUser = u;
    role = getRole(u);
    if (document.getElementById("rememberMe").checked) {
      localStorage.setItem("rememberedUser", u);
    }
    activateSession();
    renderPosts();
  } else {
    alert("Invalid alias or password.");
  }
};


document.getElementById("registerBtn").onclick = () => {
  const u = document.getElementById("username").value.trim();
  const p = document.getElementById("password").value;
  if (!u || !p) return alert("Enter both alias and password.");
  if (/\d|\@/.test(u)) return alert("Use symbolic aliases only.");
  if (users[u]) return alert("Alias already exists.");
  users[u] = p;
  localStorage.setItem("users", JSON.stringify(users));
  alert("Alias registered! Now log in.");
};


document.getElementById("logoutBtn").onclick = () => {
  localStorage.removeItem("rememberedUser");
  location.reload();
};


let posts = JSON.parse(localStorage.getItem("approvedPosts")) || [];
let pendingPosts = JSON.parse(localStorage.getItem("pendingPosts")) || [];


document.getElementById("postForm").addEventListener("submit", (e) => {
  e.preventDefault();


  const title = document.getElementById("title").value;
  const category = document.getElementById("category").value;
  const tags = document.getElementById("tags").value;
  const content = document.getElementById("content").value;
  const imageFile = document.getElementById("imageUpload").files[0];
  const galleryFlag = document.getElementById("galleryCheckbox").checked;


  if (editingPostId !== null) {
    const index = posts.findIndex(p => p.id === editingPostId);
    if (index !== -1) {
      posts[index].title = title;
      posts[index].category = category;
      posts[index].tags = tags;
      posts[index].content = content;
      posts[index].galleryFlag = galleryFlag;


      if (imageFile) {
        const reader = new FileReader();
        reader.onload = () => {
          posts[index].image = reader.result;
          finalizeEdit();
        };
        reader.readAsDataURL(imageFile);
      } else {
        finalizeEdit();
      }
    }
  } else {
    const newPost = {
      id: Date.now(),
      user: currentUser,
      title,
      category,
      tags,
      content,
      timestamp: new Date().toISOString(),
      image: null,
      galleryFlag
    };


    if (imageFile) {
      const reader = new FileReader();
      reader.onload = () => {
        newPost.image = reader.result;
        finalizePost(newPost);
      };
      reader.readAsDataURL(imageFile);
    } else {
      finalizePost(newPost);
    }
  }


  e.target.reset();
});


function finalizePost(post) {
  document.getElementById("treeVideo").classList.add("glow");
  setTimeout(() => document.getElementById("treeVideo").classList.remove("glow"), 800);


  if (role === "admin" || role === "monitor") {
    posts.push(post);
    localStorage.setItem("approvedPosts", JSON.stringify(posts));
    renderPosts();
  } else {
    pendingPosts.push(post);
    localStorage.setItem("pendingPosts", JSON.stringify(pendingPosts));
    alert("Post submitted for review.");
  }
}


function finalizeEdit() {
  localStorage.setItem("approvedPosts", JSON.stringify(posts));
  editingPostId = null;
  renderPosts();
}


function renderPosts() {
  const container = document.getElementById("posts");
  container.innerHTML = "";
  const webNodes = [];


  let sorted = [...posts].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));


  sorted.forEach((post) => {
    const div = document.createElement("div");
    div.className = "post";


    const canModify =
      currentUser === post.user ||
      (["admin", "monitor"].includes(role) && !["admin", "titan91"].includes(post.user));


    const controls = document.createElement("div");
    controls.className = "controls";


    if (canModify) {
      const editBtn = document.createElement("button");
      editBtn.title = "Edit Post";
      editBtn.innerHTML = "✏️";
      editBtn.onclick = () => editPost(post.id);


      const deleteBtn = document.createElement("button");
      deleteBtn.title = "Delete Post";
      deleteBtn.innerHTML = "🗑";
      deleteBtn.onclick = () => deletePost(post.id);


      controls.appendChild(editBtn);
      controls.appendChild(deleteBtn);
    }


    div.innerHTML = `
      <div class="post-title">${post.title}</div>
      <div class="post-meta">By ${post.user} | ${new Date(post.timestamp).toLocaleString()}</div>
      <div class="post-meta">Category: ${post.category} | Tags: ${post.tags}</div>
      <div class="post-content">${post.content}</div>
      ${post.image ? `<img src="${post.image}" class="blog-image" />` : ""}
    `;


    div.appendChild(controls);
    container.appendChild(div);


    webNodes.push({
      el: div,
      category: post.category,
      tags: post.tags.split(",").map((t) => t.trim())
    });
  });


  setTimeout(() => drawConnections(webNodes), 200);
}


function drawConnections(nodes) {
  const canvas = document.getElementById("webCanvas");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);


  for (let i = 0; i < nodes.length; i++) {
    const aRect = nodes[i].el.getBoundingClientRect();
    const aCenter = {
      x: aRect.left + aRect.width / 2,
      y: aRect.top + aRect.height / 2 + window.scrollY
    };


    for (let j = i + 1; j < nodes.length; j++) {
      const bRect = nodes[j].el.getBoundingClientRect();
      const bCenter = {
        x: bRect.left + bRect.width / 2,
        y: bRect.top + bRect.height / 2 + window.scrollY
      };


      const sameCat = nodes[i].category === nodes[j].category;
      const sharedTags = nodes[i].tags.some((t) => nodes[j].tags.includes(t));


      if (sameCat || sharedTags) {
        ctx.beginPath();
        ctx.moveTo(aCenter.x, aCenter.y);
        ctx.lineTo(bCenter.x, bCenter.y);
        ctx.strokeStyle = sameCat ? "gold" : "rgba(255,215,0,0.3)";
        ctx.setLineDash(sameCat ? [] : [4, 6]);
        ctx.lineWidth = sameCat ? 2 : 1;
        ctx.stroke();
      }
    }
  }
}


window.editPost = (id) => {
  const post = posts.find((p) => p.id === id);
  if (!post) return;
  editingPostId = id;
  document.getElementById("title").value = post.title;
  document.getElementById("category").value = post.category;
  document.getElementById("tags").value = post.tags;
  document.getElementById("content").value = post.content;
  document.getElementById("galleryCheckbox").checked = post.galleryFlag;
  window.scrollTo({ top: 0, behavior: "smooth" });
};


window.deletePost = (id) => {
  posts = posts.filter((p) => p.id !== id);
  localStorage.setItem("approvedPosts", JSON.stringify(posts));
  renderPosts();
};


document.getElementById("lightboxClose").onclick = () => {
  document.getElementById("lightbox").style.display = "none";
};


document.getElementById("lightbox").onclick = (e) => {
  if (e.target.id === "lightbox") {
    document.getElementById("lightbox").style.display = "none";
  }
};


function loadCarouselImages() {
  const carousel = document.getElementById("carousel");
  const filenames = [
    "image1.PNG", "image2.jpg", "image3.PNG", "image4.PNG", "image5.jpg",
    "image6.PNG", "image7.PNG", "image8.PNG", "image9.PNG", "image10.png",
    "image11.jpg", "image12.jpg", "image13.png", "image14.png", "image15.PNG",
    "image16.PNG", "image17.jpg", "image18.jpg", "image19.jpg", "image20.jpg", "image21.jpg"
  ];


  filenames.forEach((name) => {
    const img = document.createElement("img");
    img.src = `images/${name}`;
    img.alt = "Ancestral Image";
    img.style.cursor = "pointer";
    img.addEventListener("click", () => {
      document.getElementById("lightboxImage").src = img.src;
      document.getElementById("lightbox").style.display = "flex";
    });
    carousel.appendChild(img);
  });
}


document.getElementById("adminLoginBtn").onclick = () => {
  const pw = prompt("Enter admin password:");
  if (pw === "phoenix123" && role === "admin") {
    document.getElementById("reviewDashboard").style.display = "block";
    renderPending();
  } else {
    alert("Access denied.");
  }
};


function renderPending() {
  const container = document.getElementById("pendingPosts");
  container.innerHTML = "";


  pendingPosts.forEach((post) => {
    const div = document.createElement("div");
    div.className = "post";


    div.innerHTML = `
      <div class="post-title">${post.title}</div>
      <div class="post-meta">From: ${post.user} | ${new Date(post.timestamp).toLocaleString()}</div>
      <div class="post-meta">${post.category} | Tags: ${post.tags}</div>
      <div class="post-content">${post.content}</div>
      ${post.image ? `<img src="${post.image}" class="blog-image" />` : ""}
      ${post.galleryFlag ? `<div class="post-meta">🎨 Marked for Gallery</div>` : ""}
    `;


    const controls = document.createElement("div");
    controls.className = "controls";


    const approveBtn = document.createElement("button");
    approveBtn.textContent = "✔️";
    approveBtn.title = "Approve";
    approveBtn.onclick = () => approvePost(post.id);


    const rejectBtn = document.createElement("button");
    rejectBtn.textContent = "❌";
    rejectBtn.title = "Reject";
    rejectBtn.onclick = () => rejectPost(post.id);


    controls.appendChild(approveBtn);
    controls.appendChild(rejectBtn);
    div.appendChild(controls);


    container.appendChild(div);
  });
}


window.approvePost = (id) => {
  const post = pendingPosts.find((p) => p.id === id);
  posts.push(post);
  pendingPosts = pendingPosts.filter((p) => p.id !== id);
  localStorage.setItem("approvedPosts", JSON.stringify(posts));
  localStorage.setItem("pendingPosts", JSON.stringify(pendingPosts));
  renderPosts();
  renderPending();
};


window.rejectPost = (id) => {
  pendingPosts = pendingPosts.filter((p) => p.id !== id);
  localStorage.setItem("pendingPosts", JSON.stringify(pendingPosts));
  renderPending();
};


// INIT
renderPosts();
loadCarouselImages();