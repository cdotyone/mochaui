/*
 ---

 name: Tree

 script: Tree.js

 description: MUI - Create folder trees.

 copyright: (c) 2010 Contributors in (/AUTHORS.txt).

 license: MIT-style license in (/MIT-LICENSE.txt).

 note:
 This documentation is taken directly from the javascript source files. It is built using Natural Docs.

 depreciated: 0.9.8

 requires:
 - Core/Element
 - Core/Class
 - Core/Options
 - Core/Events
 - MUI
 - MUI.Core

 provides: [buildTree]

 ...
 */

function buildTree(treeID){

    var iconPath = MUI.path.plugins + "tree/images/";

    $$('#' + treeID + ' li.folder').each(function(folder){
        var folderContents = folder.getChildren('ul');
        var folderImage = new Element('img', {
            'src': iconPath + '_open.gif',
            'width': 18,
            'height': 18
        }).inject(folder, 'top');

        // Determine which open and close graphic each folder gets

        if (folder.hasClass('root')){
            folder.minus = iconPath + 'Rminus.gif';
            folder.plus = iconPath + 'Rplus.gif';
        }
        else if (folder.hasClass('first')){
            folder.minus = iconPath + 'Fminus.gif';
            folder.plus = iconPath + 'Fplus.gif';
        }
        else
        if (folder.getNext()){
            folder.minus = iconPath + 'Tminus.gif';
            folder.plus = iconPath + 'Tplus.gif';
        }
        else {
            folder.minus = iconPath + 'Lminus.gif';
            folder.plus = iconPath + 'Lplus.gif';
        }

        var image = new Element('img', {
            'src': folder.minus,
            'width': 18,
            'height': 18
        }).addEvent('click', function(){
            if (folder.hasClass('f-open')){
                image.setProperty('src', folder.plus);
                folderImage.setProperty('src', iconPath + '_closed.gif');
                folderContents.each(function(el){
                    el.setStyle('display', 'none');
                });
                folder.removeClass('f-open');
            }
            else {
                image.setProperty('src', folder.minus);
                folderImage.setProperty('src', iconPath + '_open.gif');
                folderContents.each(function(el){
                    el.setStyle('display', 'block');
                });
                folder.addClass('f-open');
            }
        }).inject(folder, 'top');

        if (!folder.hasClass('f-open')){
            image.setProperty('src', folder.plus);
            folderContents.each(function(el){
                el.setStyle('display', 'none');
            });
            folder.removeClass('f-open');
        }

        // Add connecting branches to each file node

        folderContents.each(function(element){
            var docs = element.getChildren('li.doc');
            docs.each(function(el){
                if (el == docs.getLast() && !el.getNext()){
                    new Element('img', {
                        'src': iconPath + 'L.gif',
                        'width': 18,
                        'height': 18
                    }).inject(el.getElement('span'), 'before');
                }
                else {
                    new Element('img', {
                        'src': iconPath + 'T.gif',
                        'width': 18,
                        'height': 18
                    }).inject(el.getElement('span'), 'before');
                }
            });
        });

    });

    // Add connecting branches to each node

    $$('#' + treeID + ' li').each(function(node){
        node.getParents('li').each(function(parent){
            if (parent.getNext()){
                new Element('img', {
                    'src': iconPath + 'I.gif',
                    'width': 18,
                    'height': 18
                }).inject(node, 'top');
            }
            else {
                new Element('img', {
                    'src': iconPath + 'spacer.gif',
                    'width': 18,
                    'height': 18
                }).inject(node, 'top');
            }
        });
    });

    $$('#' + treeID + ' li.doc').each(function(el){
        new Element('img', {
            'src': iconPath + '_doc.gif',
            'width': 18,
            'height': 18
        }).inject(el.getElement('span'), 'before');
    });

}
