<?php

include 'websymphony/dom_editor.php';

# Globals
$song_path = null;
$song_html = null;
$error = null;

# Tests if $string starts with $term
function startsWith($string, $term) {
    $length = strlen($term);
    return (substr($string, 0, $length) === $term);
}

# Tests if $url does an immediate redirect. Returns the new URL for a redirect, or false for no redirect
function redirects($url) {
    # Setup curl
    $ch = curl_init();

    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    curl_setopt($ch, CURLOPT_URL, $url);

    # Run curl
    $out = curl_exec($ch);
    $out = str_replace("\r", "", $out);

    # Check headers for redirect
    $headers_end = strpos($out, "\n\n");
    if ($headers_end !== false) {
        $out = substr($out, 0, $headers_end);
    }

    $headers = explode("\n", $out);
    foreach ($headers as $header) {
        if (substr($header, 0, 10) == "Location: ") {
            return substr($header, 10);
        }
    }

    return false;
}

# Follows redirects for a certain number of times
# Returns the new url if there is a redirect, the old url if there are no redirects,
# and false if there are too many
function resolveRedirects($url) {
    # Follow redirection $redirect_count times, if necessary
    $redirect_try = 0;
    $redirect_count = 5;
    while (true) {
        $redirect = redirects($url);
        if ($redirect == false) {
            break;
        }
        $url = $redirect;
        $redirect_try++;
        if ($redirect_try > $redirect_count) {
            return false;
        }
    }
    return $url;
}

# Cleans the HTML using the "PHP Simple HTML DOM Parser" library
# Removes all unnecessary tags, fixes relative links into absolute links, and disables input fields
function clean(simple_html_dom $html, $url) {
    # Check for last slash after http(s)://, to find the true base url
    # This is needed to transform relative urls into absolute urls
    $lastSlash = strrpos($url, '/', 8);
    if ($lastSlash > -1) {
        $url = substr($url, 0, $lastSlash);
    }

    # Remove "meta", "video", "audio", "script", and "embed" tags
    foreach ($html->find('meta, video, audio, script, embed') as $element) {
        $element->outertext = '';
    }

    # Remove all attributes other than 'id' and 'class' for "a" tag
    # This will remove the link itself, but leave all the styling in place
    foreach ($html->find('a') as $element) {
        foreach ($element->attr as $key=>$value) {
            if ($key != 'id' && $key != 'class') {
                unset($element->attr[$key]);
            }
        }
    }

    # Fix relative url for "link" tag
    foreach ($html->find('link') as $element) {
        if ($element->rel == 'stylesheet') {
            $element->href = makeAbsolute($element->href, $url);
        }
    }

    # Fix relative url for "img" tag
    foreach ($html->find('img') as $element) {
        $element->src = makeAbsolute($element->src, $url);
    }

    # Remove all attributes other than 'id', 'class', 'value', and 'type' for "a" tag, and add a 'disabled' attribute
    # This removes all behavior from the inputs, and grays them out
    foreach ($html->find('input') as $element) {
        foreach ($element->attr as $key=>$value) {
            if ($key != 'id' && $key != 'class' && $key != 'value' && $key != 'type') {
                unset($element->attr[$key]);
            }
        }
        $element->attr['disabled'] = true;
    }
}

# Turns a $relative_url into an absolute url relative to $site_url
function makeAbsolute($relative_url, $site_url) {
    if (!startsWith($relative_url, 'http://') &&
        !startsWith($relative_url, 'https://') &&
        !startsWith($relative_url, 'www.') &&
        !startsWith($relative_url, '//')) {
        if (!startsWith($relative_url, '/')) {
            $relative_url = '/' . $relative_url;
        }
        $relative_url = $site_url . $relative_url;
    }
    return $relative_url;
}

# Delete old temp files, create new temp file, write $song_html to it.
function handleTempFile() {
    global $song_html, $song_path;

    $songDirectory = 'websymphony/songs/';

    # Remove all old songs from the song directory
    if ($handle = opendir($songDirectory)) {
        while (false !== ($entry = readdir($handle))) {
            if ($entry !== '.' && $entry !== '..') {
                $full_path = realpath($songDirectory . $entry);
                $time = time() - filemtime($full_path);
                if ($time > 200) {
                    unlink($full_path);
                }
            }
        }
    }

    # Create a temporary file prefixed with song_ with the extension .html
    $song_full_path = tempnam($songDirectory, 'song_');

    # Removes the file created with no extension
    unlink($song_full_path);

    $song_full_path = $song_full_path . '.html';
    $song_path = $songDirectory . basename($song_full_path);

    # Write $song_html to $song_path, ready to be displayed.
    $file = fopen($song_path, 'w');
    fwrite($file, $song_html);
    chmod($file, 755);
    fclose($file);
}

# Makes all the HTML for a song, and places it into a temporary file $song_path
function makeSongHtml($url) {
    global $song_html, $error;

    $url = resolveRedirects($url);
    if ($url === false) {
        $error = "Too many redirects";
        return false;
    }

    # Grab HTML and construct DOM object.
    $song_html = file_get_contents($url);
    $html = str_get_html($song_html);

    if ($html == false) {
        echo 'Parse error';
        $error = 'Could not parse HTML';
        return false;
    } else {
        # Clean HTML and write to $song_html
        clean($html, $url);
        $song_html =
            # Mobile meta tags
            '<meta content=\'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0\' name=\'viewport\' />' .
            '<meta name="viewport" content="width=device-width" />' .
            # Song info header tags
            '<div id="song_info"><div id="song_progress"><div></div></div>' .
            '<br><br><input id="song_start" type="button" value="Start"></input>' .
            '<input id="song_stop" type="button" value="Stop"></input>' .
            '<input id="song_restart" type="button" value="Restart"></input>' .
            '</div>' .
            # Canvas
            '<canvas id="song_animation_canvas"></canvas>' .
            # Body HTML
            $html->save() .
            # Stylesheets and JS libraries
            '<link rel="stylesheet" type="text/css" href="../song-style.css">' .
            '<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>' .
            '<script type="text/javascript" src="../howler.min.js"></script>' .
            '<script type="text/javascript" src="../song-engine.js"></script>';
    }

    handleTempFile();

    return true;
}
?>

<html>
<head>
    <link rel="stylesheet" type="text/css" href="websymphony/foundation.css">
    <link rel="stylesheet" type="text/css" href="websymphony/Style.css">
</head>
<body>
<?php
$url = $_GET['url'];
$valid_page = false;

if ($url != null) {
    # Check that $url starts with http:// followed by www., and adds it if it's missing.
    if (!(startsWith($url, 'http://') || startsWith($url, 'https://'))) {
        if (!(startsWith($url, 'www.'))) {
            $url = 'www.' . $url;
        }
        $url = 'http://' . $url;
    }

    # Validate $url against regex and verify that the site can be accessed by the server.
    if (preg_match("#^https?://.+#", $url) && @fopen($url, 'r')) {
        $result = makeSongHtml($url);
        if ($result === true) {
            $valid_page = true;
        } else {
            $error = $result;
        }
    }
}

if (!$valid_page) {
    $url = 'Target URL';
}
?>
    <div class="row">
        <h1 class="two column centered title">Web Symphony</h1>
    </div>
    <form method="get">
        <div class="row">
            <input class="two column centered text" type="text" name="url" value='<?echo $url?>'/>
        </div>
        <div class="row">
            <input class="two column centered button" type="submit" value="Create Song"/>
        </div>
    </form>
<?if ($valid_page) {?>
    <table class="container">
        <tbody>
            <tr>
                <td>
                    <iframe id="song" src="<?php echo $song_path; ?>">
                    </iframe>
                </td>
            </tr>
        </tbody>
    </table>
<?}?>
</body>
</html>
