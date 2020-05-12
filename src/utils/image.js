import exif from 'exif-js';

export function resizeImage(image, callBack) {
    let MAX_WIDTH = 1000;
    let MAX_HEIGHT = 1000;
    let canvas = document.createElement("canvas");
    let img = new Image;
    img.onload = function () {
        exif.getData(img, function () {
            let orientation = exif.getAllTags(this).Orientation;
            let width = img.width;
            let height = img.height;
            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }
            if ([5, 6, 7, 8].indexOf(orientation) > -1) {
                canvas.width = height;
                canvas.height = width;
            } else {
                canvas.width = width;
                canvas.height = height;
            }

            let ctx = canvas.getContext("2d");
            switch (orientation) {
                case 2:
                    ctx.transform(-1, 0, 0, 1, width, 0);
                    break;
                case 3:
                    ctx.transform(-1, 0, 0, -1, width, height);
                    break;
                case 4:
                    ctx.transform(1, 0, 0, -1, 0, height);
                    break;
                case 5:
                    ctx.transform(0, 1, 1, 0, 0, 0);
                    break;
                case 6:
                    ctx.transform(0, 1, -1, 0, height, 0);
                    break;
                case 7:
                    ctx.transform(0, -1, -1, 0, height, width);
                    break;
                case 8:
                    ctx.transform(0, -1, 1, 0, 0, width);
                    break;
                default:
                    ctx.transform(1, 0, 0, 1, 0, 0);
            }
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob((result) => {
                result.name = "image.jpeg";
                callBack(result)
            }, 'image/jpeg', 0.95);

        });
    };
    img.src = URL.createObjectURL(image);
}