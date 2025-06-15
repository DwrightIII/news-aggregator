// DOM Elements
const container = document.getElementById("news-container");
const savedContainer = document.getElementById("saved-container");
const dropdown = document.getElementById("sourceSelect");
const rssInput = document.getElementById("rssInput");
const addFeedBtn = document.getElementById("addFeedBtn");
const categoryFilter = document.getElementById("categoryFilter");
const keywordFilter = document.getElementById("keywordFilter");
const searchBtn = document.getElementById("searchBtn");
const dateFilter = document.getElementById("dateFilter");
const darkModeToggle = document.getElementById("darkModeToggle");

// Wait until the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  initializeEventListeners();
  fetchNews(dropdown.value);
  registerServiceWorker(); // ✅ Register service worker on page load
});

// Initialize event listeners
function initializeEventListeners() {
  const viewSavedBtn = document.getElementById("viewSavedBtn");
  const viewAllFeedsBtn = document.getElementById("viewAllFeedsBtn");

  if (viewSavedBtn) {
    viewSavedBtn.addEventListener("click", loadSavedArticles);
  } else {
    console.error("viewSavedBtn not found in the DOM!");
  }

  if (viewAllFeedsBtn) {
    viewAllFeedsBtn.addEventListener("click", fetchAllFeeds);
  } else {
    console.error("viewAllFeedsBtn not found in the DOM!");
  }

  searchBtn.addEventListener("click", () => fetchNews(dropdown.value));
  dropdown.addEventListener("change", () => fetchNews(dropdown.value));
  
  darkModeToggle.addEventListener("click", toggleDarkMode);
}

// Dark Mode Toggle
function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem("darkMode", document.body.classList.contains("dark-mode") ? "enabled" : "disabled");
}

// Fetch All Feeds
function fetchAllFeeds() {
  const urls = Array.from(dropdown.options).map(option => option.value);
  const articlePromises = urls.map(url => {
    const apiURL = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`;
    return fetch(apiURL).then(res => res.json()).then(data => data.items || []).catch(() => []);
  });

  container.innerHTML = "<p>Loading all news sources...</p>";

  Promise.all(articlePromises).then(results => {
    let allArticles = results.flat();
    applyFilters(allArticles);
  });
}

// Fetch Single Feed
function fetchNews(rssURL) {
  const apiURL = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssURL)}`;
  container.innerHTML = "<p>Loading articles...</p>";

  fetch(apiURL).then(response => response.json()).then(data => {
    let articles = data.items;
    applyFilters(articles);
  }).catch(() => {
    container.innerHTML = "<p>Failed to load news.</p>";
  });
}

// Apply Filters
function applyFilters(articles) {
  const category = categoryFilter.value;
  const keyword = keywordFilter.value.toLowerCase();
  const selectedDate = new Date(dateFilter.value);

  if (category !== "all") {
    articles = articles.filter(a => a.categories?.includes(category));
  }

  if (keyword) {
    articles = articles.filter(a => a.title.toLowerCase().includes(keyword) || a.description?.toLowerCase().includes(keyword));
  }

  if (!isNaN(selectedDate.getTime())) {
    articles = articles.filter(a => new Date(a.pubDate) >= selectedDate);
  }

  articles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  displayArticles(articles);
}

// Display Articles
function displayArticles(articles) {
  container.innerHTML = "";
  articles.slice(0, 20).forEach(article => {
    const summary = summarizeText(article.description || article.content || article.title);
    const relativeTime = getRelativeTime(article.pubDate);

    const div = document.createElement("div");
    div.className = "article";
    div.innerHTML = `
      <h2><a href="${article.link}" target="_blank">${article.title}</a></h2>
      <p><strong>Published:</strong> ${relativeTime}</p>
      <p>${summary}</p>
      <button onclick="saveArticle('${encodeURIComponent(article.title)}', '${encodeURIComponent(article.link)}')">Save Article</button>
    `;
    container.appendChild(div);
  });
}

// Convert Timestamp to Relative Time
function getRelativeTime(pubDate) {
  const now = new Date();
  const articleDate = new Date(pubDate);
  const diffSeconds = Math.floor((now - articleDate) / 1000);

  if (diffSeconds < 60) return `${diffSeconds} seconds ago`;
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hours ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} days ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

// Summarize Article
function summarizeText(text) {
  return text.split(". ").slice(0, 3).join(". ") + "...";
}

// Save Article
function saveArticle(title, link) {
  const saved = JSON.parse(localStorage.getItem("savedArticles")) || [];
  saved.push({ title: decodeURIComponent(title), link: decodeURIComponent(link) });
  localStorage.setItem("savedArticles", JSON.stringify(saved));
  alert("Article saved!");
}

// Load Saved Articles
function loadSavedArticles() {
  savedContainer.innerHTML = "<h2>Saved Articles</h2>";
  const savedArticles = JSON.parse(localStorage.getItem("savedArticles")) || [];

  if (savedArticles.length === 0) {
    savedContainer.innerHTML += "<p>No saved articles yet.</p>";
    return;
  }

  savedArticles.forEach(article => {
    const div = document.createElement("div");
    div.className = "article";
    div.innerHTML = `<h3><a href="${article.link}" target="_blank">${article.title}</a></h3>`;
    savedContainer.appendChild(div);
  });
}

// Register Service Worker
function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/service-worker.js")
      .then(() => console.log("✅ Service Worker Registered"))
      .catch(error => console.error("Service Worker Registration Failed:", error));
  }
}