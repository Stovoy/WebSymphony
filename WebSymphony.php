<?php

include 'websymphony/dom_editor.php';

$song_path = null;
$song_html = null;
$error = null;

function startsWith($string, $term) {
    $length = strlen($term);
    return (substr($string, 0, $length) === $term);
}

function redirects($url) {
    $ch = curl_init();

    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    curl_setopt($ch, CURLOPT_URL, $url);
    $out = curl_exec($ch);

    $out = str_replace("\r", "", $out);

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

function clean(simple_html_dom $html, $url) {
    $base_url = null;
    $lastSlash = strrpos($url, '/', 8); //Check for last slash after http(s)://
    if ($lastSlash > -1) {
        $base_url = substr($url, 0, $lastSlash);
    }
    foreach ($html->find('meta, video, audio, script, embed') as $element) {
        $element->outertext = '';
    }
    foreach ($html->find('a') as $element) {
        foreach ($element->attr as $key=>$value) {
            if ($key != 'id' && $key != 'class') {
                unset($element->attr[$key]);
            }
        }
    }
    foreach ($html->find('link') as $element) {
        if ($element->rel == 'stylesheet') {
            $element->href = makeAbsolute($element->href, $url, $base_url);
        }
    }
    foreach ($html->find('img') as $element) {
        $element->src = makeAbsolute($element->src, $url, $base_url);
    }
    foreach ($html->find('input') as $element) {
        foreach ($element->attr as $key=>$value) {
            if ($key != 'id' && $key != 'class' && $key != 'value' && $key != 'type') {
                unset($element->attr[$key]);
            }
        }
        $element->attr['disabled'] = true;
    }
}

function makeAbsolute($relative_url, $site_url, $site_base_url) {
    if (!startsWith($relative_url, 'http://') &&
        !startsWith($relative_url, 'https://') &&
        !startsWith($relative_url, 'www.') &&
        !startsWith($relative_url, '//')) {
        if (!startsWith($relative_url, '/')) {
            $relative_url = '/' . $relative_url;
        }
        if ($site_base_url == null) {
            $relative_url = $site_url . $relative_url;
        } else {
            $relative_url = $site_base_url . $relative_url;
        }
    }
    return $relative_url;
}

function makeSong($url) {
    global $song_html, $song_path, $error;

    $songDirectory = 'websymphony/songs/';

    if ($handle = opendir($songDirectory)) {
        /* This is the correct way to loop over the directory. */
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

    $song_full_path = tempnam($songDirectory, 'song_');
    unlink($song_full_path);
    $song_full_path = $song_full_path . '.html';
    $song_path = $songDirectory . basename($song_full_path);

    $redirect = redirects($url);
    if ($redirect != false) {
        $url = $redirect;
        $redirect = redirects($url);
        if ($redirect != false) {
            $url = $redirect;
            echo $url . '<br>';
            $redirect = redirects($url);
            if ($redirect != false) {
                $url = $redirect;
                echo $url . '<br>';
                $redirect = redirects($url);
                if ($redirect != false) {
                    $error = "Too many redirects";
                    return false;
                }
            }
        }
    }

    $song_html = file_get_contents($url);

    $html = str_get_html($song_html);

    if ($html == false) {
        echo 'Parse error';
        $error = 'Could not parse HTML';
    } else {
        clean($html, $url);
        $song_html = '<meta content=\'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0\' name=\'viewport\' />' .
            '<meta name="viewport" content="width=device-width" />' .
            '<div id="song_info"><div id="song_progress"><div></div></div>' .
            '<br><br><input id="song_start" type="button" value="Start"></input>' .
            '<input id="song_stop" type="button" value="Stop"></input>' .
            '<input id="song_restart" type="button" value="Restart"></input>' .
            '</div>' .
            '<canvas id="song_animation_canvas"></canvas>' .
            $html->save() .
            '<link rel="stylesheet" type="text/css" href="../song-style.css">' .
            '<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>' .
            '<script type="text/javascript" src="../howler.min.js"></script>' .
            '<script type="text/javascript" src="../song-engine.js"></script>';
    }

    $file = fopen($song_path, 'w');
    fwrite($file, $song_html);
    chmod($file, 755);
    fclose($file);

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
    if (!(startsWith($url, 'http://') || startsWith($url, 'https://'))) {
        if (!(startsWith($url, 'www.'))) {
            $url = 'www.' . $url;
        }
        $url = 'http://' . $url;
    }

    if (preg_match("#^https?://.+#", $url) && @fopen($url, 'r')) {
        $result = makeSong($url);
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
