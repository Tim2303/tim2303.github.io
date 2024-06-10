import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

async function onLoad() {
    const rootElement = document.getElementById('root');
    if (!rootElement) return;

    const root = createRoot(rootElement);
    root.render(
        <div>
            <GithubRepoSearch></GithubRepoSearch>
        </div>
    );
}

const GithubRepoSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [repos, setRepos] = useState([]);

  const searchRepos = async () => {
    const response = await fetch(`https://api.github.com/search/repositories?q=${searchTerm}&sort=stars&order=desc`);
    const data = await response.json();
    setRepos(data.items);
  };

  return (
    <div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Enter a keyword"
      />
      <button onClick={searchRepos}>Search</button>
      <ul>
        {repos.map((repo) => (
          <li>Score:{repo.stargazers_count}::::{repo.name}":"<a href={repo.html_url}>{repo.html_url}</a></li>
        ))}
      </ul>
    </div>
  );
};

export default GithubRepoSearch;

window.onload = onLoad;