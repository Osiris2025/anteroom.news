from engine.agents.text_clean import clean_title, clean_summary


def test_title_tags_and_entities():
    assert clean_title("The <i>Times</i> report") == "The Times report"
    assert clean_title("The &lt;i&gt;Times&lt;/i&gt; report") == "The Times report"
    assert clean_title("The &amp;lt;i&amp;gt;Times&amp;lt;/i&amp;gt; report") == "The Times report"
    assert clean_title("Rock &amp; Roll &#8217;s back") == "Rock & Roll ’s back"


def test_title_editorial_marks():
    assert clean_title("[UPDATED] Big news (VIDEO)") == "Big news"
    assert clean_title("Breaking: [Photos] x") == "Breaking: [Photos] x"
    assert clean_title("**Bold** claim") == "Bold claim"
    assert clean_title("Python 3.14 [arrays] tips") == "Python 3.14 [arrays] tips"


def test_summary_footers():
    s = "Cool robots story. submitted by /u/bob to /r/tech [link] [comments]"
    assert clean_summary(s) == "Cool robots story."
    assert clean_summary("<p>Real text here.</p><p>Discuss</p>") == "Real text here."
    assert clean_summary("Real text here. Link | Discuss") == "Real text here."
    assert clean_summary("Article URL: https://x.y Comments URL: https://n.y Points: 5 # Comments: 2") == ""
    assert clean_summary("The post Foo bar appeared first on Site.") == ""


def test_summary_keeps_normal_words():
    s = "Officials will discuss the link between diet and sleep."
    assert clean_summary(s) == s


def test_lowercase_discuss_at_end_kept():
    assert clean_summary("Leaders met to discuss") == "Leaders met to discuss"


def test_discussion_link_footer():
    s = "Learn a language, Duolingo-style.\n\n\n            Discussion\n            |\n            Link\n          "
    assert clean_summary(s) == "Learn a language, Duolingo-style."
