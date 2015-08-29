---
title: Search Parameter Highlighting in PDF.js
author: Kaz Smith
date: 2015/08/27
description: Blog article by Kaz Smith
tags:
- enterprise_software
- document_management
- it_strategy
---

<h3><a id="Introduction_2"></a>Introduction</h3>
<p>Mozilla’s PDF.js is a great utility for rendering PDFs in the browser. PDF.js is very versatile, and can be used to display a PDF anywhere in a webpage. At Mazira, we’re developing GoldFynch, a web application which lawyers will use to organize, search, and process the large volume of case documents they handle. Since GoldFynch handles lots of documents, PDF rendering support within the application is very important. We chose to use PDF.js to render PDFs (and documents converted to PDF) in GoldFynch. We’ve been very happy with the capabilities of PDF.js.</p>
<h3><a id="The_Problem_5"></a>The Problem</h3>
<p>However, PDF.js is a generalized application designed to provide a commonly used subset of tools for PDF rendering and processing. It can’t fit everyone’s needs, and it didn’t perfectly fit our needs. As we’ve developed GoldFynch here at Mazira, a number of lawyers have requested the ability to use GoldFynch to open attachments displayed in PDF versions of emails. This is a fairly specific problem, so it’s not handled by PDF.js. We had to develop our own solution. One important part of turning these attachment filenames into links is highlighting them to indicate that they are clickable. I was tasked with editing PDF.js to handle a “search” parameter in the URL used to open the PDF. This search parameter would then be highlighted in the PDF. With this solution, we could easily draw attention to any part of the PDF.</p>
<h3><a id="The_Solution_highlighting_stuff_8"></a>The Solution (highlighting stuff)</h3>
<p>Within PDF.js, I had to make a few changes to viewer.js. I decided the best way to do the highlighting was to work alongside the find functionality in PDF.js. Under the hood, PDF.js contains lots of small divs which contain parts of the text of the PDF. Mirroring the find functionality would give me access to these divs. However, I knew I couldn’t just trigger the find bar to search for the URL search parameter, since that would cause the highlighting to be removed when the user used the find bar to search for something else.</p>
<p>When you use the find bar in PDF.js, it just searches the page text for matches to your query. I copied this idea, and saved a separate set of matches for the URL search parameter. The actual displaying of the highlighting is where it gets a bit more interesting. I needed the highlighting to stay there and to not interfere with the find bar functionality. I decided to change  the background of the various divs containing pieces of the PDF text to a transparent yellow to act as highlighting. However, these divs might contain more than just the text I wanted to highlight. They could also contain only part of the text I wanted to highlight. To deal with this issue, I decided to use CSS gradients.</p>
<p>Here’s the first part of my code:</p>
<pre><code class="language-javascript"><span class="hljs-keyword">var</span> k0 = <span class="hljs-number">0</span>, k1 = parMatches.length;
<span class="hljs-keyword">for</span> (<span class="hljs-keyword">var</span> k = k0; k &lt; k1; k++) {
    <span class="hljs-keyword">var</span> parMatch = parMatches[k];
    <span class="hljs-keyword">var</span> begin = parMatch.begin;
    <span class="hljs-keyword">var</span> end = parMatch.end;
    
    <span class="hljs-keyword">var</span> hlBeginPercent = begin.offset / bidiTexts[begin.divIdx].str.length * <span class="hljs-number">100</span>;
    hlBeginPercent = hlBeginPercent.toFixed(<span class="hljs-number">1</span>);
    <span class="hljs-keyword">var</span> hlEndPercent = end.offset / bidiTexts[end.divIdx].str.length * <span class="hljs-number">100</span>;
    hlEndPercent = hlEndPercent.toFixed(<span class="hljs-number">1</span>);
    ...
</code></pre>
<p>I loop through the text matches - <code>parMatch</code> represents a specific match. <code>begin</code> represents the text div in which the match starts, and <code>end</code> represents the text div in which the match ends. Next I calculate a couple of percentages. The first, <code>hlBeginPercent</code>, represents the position in the <code>begin</code> div at which the highlighting should start. <code>begin.offset</code> is the number of characters into the <code>begin</code> div at which the match starts, and <code>bidiTexts</code> is an array containing all the text divs. So, <code>bidiTexts[begin.divIdx].str.length</code> is the length of the text in the <code>begin</code> div. Therefore <code>hlBeginPercent</code> gets set to the position in the <code>begin</code> div at which the match text starts, calculated as a percentage. <code>hlEndPercent</code> is essentially the same, but it represents the position in the <code>end</code> div at which the match text ends.</p>
<p>Now I actually apply the gradients:</p>
<pre><code class="language-javascript"><span class="hljs-keyword">if</span> (begin.divIdx === end.divIdx) { <span class="hljs-comment">// the string to be highlighted is all in one div</span>
    <span class="hljs-keyword">var</span> beginStr = <span class="hljs-string">'(left, '</span> +
                    <span class="hljs-string">'rgba(0, 0, 0, 0) 0%, '</span> +
                    <span class="hljs-string">'rgba(0, 0, 0, 0) '</span> + hlBeginPercent + <span class="hljs-string">'%, '</span> +
                    <span class="hljs-string">'rgba(255, 255, 0, 0.9) '</span> + hlBeginPercent + <span class="hljs-string">'%, '</span> +
                    <span class="hljs-string">'rgba(255, 255, 0, 0.9) '</span> + hlEndPercent + <span class="hljs-string">'%, '</span> +
                    <span class="hljs-string">'rgba(0, 0, 0, 0) '</span> + hlEndPercent + <span class="hljs-string">'%, '</span> +
                    <span class="hljs-string">'rgba(0, 0, 0, 0) 100%)'</span>;
    textDivs[begin.divIdx].style.background = <span class="hljs-string">'-webkit-linear-gradient'</span> + beginStr;
    textDivs[begin.divIdx].style.background = <span class="hljs-string">'-moz-linear-gradient'</span> + beginStr;
    textDivs[begin.divIdx].style.background = <span class="hljs-string">'-ms-linear-gradient'</span> + beginStr;
    textDivs[begin.divIdx].style.background = <span class="hljs-string">'-o-linear-gradient'</span> + beginStr;
    textDivs[begin.divIdx].style.background = <span class="hljs-string">'linear-gradient'</span> + beginStr;
} <span class="hljs-keyword">else</span> {
    ...
</code></pre>
<p>If the match text is all contained in one text div, it’s not too complicated. You can look at the syntax for CSS gradients <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/linear-gradient">here</a>. My gradient sets the background of the text div to be transparent until <code>hlBeginPercent</code>% of the way into the div, then to be a slightly transparent yellow until <code>hlEndPercent</code>% of the way into the div, then to be transparent again until the end of the div. This results in the div being a slightly transparent yellow where the match text is, which makes the match text look highlighted.</p>
<p>Lastly, here’s the code used when the match text is contained in multiple divs:</p>
<pre><code class="language-javascript">} <span class="hljs-keyword">else</span> { <span class="hljs-comment">// the string to be highlighted is contained in multiple divs</span>
    <span class="hljs-comment">// the first div</span>
    <span class="hljs-keyword">var</span> beginStr = <span class="hljs-string">'(left, '</span> +
                  <span class="hljs-string">'rgba(0, 0, 0, 0) 0%, '</span> +
                  <span class="hljs-string">'rgba(0, 0, 0, 0) '</span> + hlBeginPercent + <span class="hljs-string">'%, '</span> +
                  <span class="hljs-string">'rgba(255, 255, 0, 0.9) '</span> + hlBeginPercent + <span class="hljs-string">'%, '</span> +
                  <span class="hljs-string">'rgba(255, 255, 0, 0.9) 100%)'</span>;
    textDivs[begin.divIdx].style.background = <span class="hljs-string">'-webkit-linear-gradient'</span> + beginStr;
    textDivs[begin.divIdx].style.background = <span class="hljs-string">'-moz-linear-gradient'</span> + beginStr;
    textDivs[begin.divIdx].style.background = <span class="hljs-string">'-ms-linear-gradient'</span> + beginStr;
    textDivs[begin.divIdx].style.background = <span class="hljs-string">'-o-linear-gradient'</span> + beginStr;
    textDivs[begin.divIdx].style.background = <span class="hljs-string">'linear-gradient'</span> + beginStr;

    <span class="hljs-comment">// any divs in between the first and last divs</span>
    <span class="hljs-comment">// in which the string to be highlighted is contained</span>
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">var</span> midDivIdx = begin.divIdx + <span class="hljs-number">1</span>; midDivIdx &lt; end.divIdx; ++midDivIdx) {
        textDivs[midDivIdx].style.background = <span class="hljs-string">'rgba(255, 255, 0, 0.9)'</span>;
    }

    <span class="hljs-comment">// the last div</span>
    <span class="hljs-keyword">var</span> endStr =  <span class="hljs-string">'(left, '</span> +
                  <span class="hljs-string">'rgba(255, 255, 0, 0.9) 0%, '</span> +
                  <span class="hljs-string">'rgba(255, 255, 0, 0.9) '</span> + hlEndPercent + <span class="hljs-string">'%, '</span> +
                  <span class="hljs-string">'rgba(0, 0, 0, 0) '</span> + hlEndPercent + <span class="hljs-string">'%, '</span> +
                  <span class="hljs-string">'rgba(0, 0, 0, 0) 100%)'</span>;
    textDivs[end.divIdx].style.background = <span class="hljs-string">'-webkit-linear-gradient'</span> + endStr;
    textDivs[end.divIdx].style.background = <span class="hljs-string">'-moz-linear-gradient'</span> + endStr;
    textDivs[end.divIdx].style.background = <span class="hljs-string">'-ms-linear-gradient'</span> + endStr;
    textDivs[end.divIdx].style.background = <span class="hljs-string">'-o-linear-gradient'</span> + endStr;
    textDivs[end.divIdx].style.background = <span class="hljs-string">'linear-gradient'</span> + endStr;
}
</code></pre>
<p>The first div gets highlighted from <code>hlBeginPercent</code>% of the way into the div to the end. Any divs in the middle get completely highlighted. The last div gets highlighted from the beginning through <code>hlEndPercent</code>% of the way into the div.</p>
<p>That’s all! Here’s the full block of code (remember to make it cross browser!)</p>
<pre><code class="language-javascript"><span class="hljs-keyword">var</span> k0 = <span class="hljs-number">0</span>, k1 = parMatches.length;
<span class="hljs-keyword">for</span> (<span class="hljs-keyword">var</span> k = k0; k &lt; k1; k++) {
    <span class="hljs-keyword">var</span> parMatch = parMatches[k];
    <span class="hljs-keyword">var</span> begin = parMatch.begin;
    <span class="hljs-keyword">var</span> end = parMatch.end;
    
    <span class="hljs-keyword">var</span> hlBeginPercent = begin.offset / bidiTexts[begin.divIdx].str.length * <span class="hljs-number">100</span>;
    hlBeginPercent = hlBeginPercent.toFixed(<span class="hljs-number">1</span>);
    <span class="hljs-keyword">var</span> hlEndPercent = end.offset / bidiTexts[end.divIdx].str.length * <span class="hljs-number">100</span>;
    hlEndPercent = hlEndPercent.toFixed(<span class="hljs-number">1</span>);
    <span class="hljs-keyword">if</span> (begin.divIdx === end.divIdx) { <span class="hljs-comment">// the string to be highlighted is all in one div</span>
        <span class="hljs-keyword">var</span> beginStr = <span class="hljs-string">'(left, '</span> +
                        <span class="hljs-string">'rgba(0, 0, 0, 0) 0%, '</span> +
                        <span class="hljs-string">'rgba(0, 0, 0, 0) '</span> + hlBeginPercent + <span class="hljs-string">'%, '</span> +
                        <span class="hljs-string">'rgba(255, 255, 0, 0.9) '</span> + hlBeginPercent + <span class="hljs-string">'%, '</span> +
                        <span class="hljs-string">'rgba(255, 255, 0, 0.9) '</span> + hlEndPercent + <span class="hljs-string">'%, '</span> +
                        <span class="hljs-string">'rgba(0, 0, 0, 0) '</span> + hlEndPercent + <span class="hljs-string">'%, '</span> +
                        <span class="hljs-string">'rgba(0, 0, 0, 0) 100%)'</span>;
        textDivs[begin.divIdx].style.background = <span class="hljs-string">'-webkit-linear-gradient'</span> + beginStr;
        textDivs[begin.divIdx].style.background = <span class="hljs-string">'-moz-linear-gradient'</span> + beginStr;
        textDivs[begin.divIdx].style.background = <span class="hljs-string">'-ms-linear-gradient'</span> + beginStr;
        textDivs[begin.divIdx].style.background = <span class="hljs-string">'-o-linear-gradient'</span> + beginStr;
        textDivs[begin.divIdx].style.background = <span class="hljs-string">'linear-gradient'</span> + beginStr;
    } <span class="hljs-keyword">else</span> { <span class="hljs-comment">// the string to be highlighted is contained in multiple divs</span>
        <span class="hljs-comment">// the first div</span>
        <span class="hljs-keyword">var</span> beginStr = <span class="hljs-string">'(left, '</span> +
                        <span class="hljs-string">'rgba(0, 0, 0, 0) 0%, '</span> +
                        <span class="hljs-string">'rgba(0, 0, 0, 0) '</span> + hlBeginPercent + <span class="hljs-string">'%, '</span> +
                        <span class="hljs-string">'rgba(255, 255, 0, 0.9) '</span> + hlBeginPercent + <span class="hljs-string">'%, '</span> +
                        <span class="hljs-string">'rgba(255, 255, 0, 0.9) 100%)'</span>;
        textDivs[begin.divIdx].style.background = <span class="hljs-string">'-webkit-linear-gradient'</span> + beginStr;
        textDivs[begin.divIdx].style.background = <span class="hljs-string">'-moz-linear-gradient'</span> + beginStr;
        textDivs[begin.divIdx].style.background = <span class="hljs-string">'-ms-linear-gradient'</span> + beginStr;
        textDivs[begin.divIdx].style.background = <span class="hljs-string">'-o-linear-gradient'</span> + beginStr;
        textDivs[begin.divIdx].style.background = <span class="hljs-string">'linear-gradient'</span> + beginStr;
    
        <span class="hljs-comment">// any divs in between the first and last divs</span>
        <span class="hljs-comment">// in which the string to be highlighted is contained</span>
        <span class="hljs-keyword">for</span> (<span class="hljs-keyword">var</span> midDivIdx = begin.divIdx + <span class="hljs-number">1</span>; midDivIdx &lt; end.divIdx; ++midDivIdx) {
            textDivs[midDivIdx].style.background = <span class="hljs-string">'rgba(255, 255, 0, 0.9)'</span>;
        }
    
        <span class="hljs-comment">// the last div</span>
        <span class="hljs-keyword">var</span> endStr =  <span class="hljs-string">'(left, '</span> +
                      <span class="hljs-string">'rgba(255, 255, 0, 0.9) 0%, '</span> +
                      <span class="hljs-string">'rgba(255, 255, 0, 0.9) '</span> + hlEndPercent + <span class="hljs-string">'%, '</span> +
                      <span class="hljs-string">'rgba(0, 0, 0, 0) '</span> + hlEndPercent + <span class="hljs-string">'%, '</span> +
                      <span class="hljs-string">'rgba(0, 0, 0, 0) 100%)'</span>;
        textDivs[end.divIdx].style.background = <span class="hljs-string">'-webkit-linear-gradient'</span> + endStr;
        textDivs[end.divIdx].style.background = <span class="hljs-string">'-moz-linear-gradient'</span> + endStr;
        textDivs[end.divIdx].style.background = <span class="hljs-string">'-ms-linear-gradient'</span> + endStr;
        textDivs[end.divIdx].style.background = <span class="hljs-string">'-o-linear-gradient'</span> + endStr;
        textDivs[end.divIdx].style.background = <span class="hljs-string">'linear-gradient'</span> + endStr;
    }
}
</code></pre>
<p>And here’s a screenshot of what the highlighting in PDF.js looks like (note the yellow highlighting):
<img src="http://i.imgur.com/ZKXRL8n.png" alt="pdf.js highlighting screenshot"></p>

</body></html>
