'use strict';

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const Image = use('App/Models/Image');
const {manage_single_upload, manage_multiple_uploads} = use('App/Helpers');
const fs = use('fs');
const Transformer = use('App/Transformers/Admin/ImageTransformer');
const Helpers = use('Helpers');

/**
 * Resourceful controller for interacting with images
 */
class ImageController {
  /**
   * Show a list of all images.
   * GET images
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {Pagination} ctx.pagination
   */
  async index({response, pagination}) {
    let images = await Image.query()
      .orderBy('id', 'DESC')
      .paginate(pagination.page, pagination.limit);

    return response.send(images);
  }

  /**
   * Create/save a new image.
   * POST images
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store({request, response, transform}) {
    try {
      const fileJar = request.file('images', {
        types: ['image'],
        size: '1mb',
      });

      let images = [];

      if (!fileJar.files) {
        const file = await manage_single_upload(fileJar);

        if (file.moved()) {
          const image = await Image.create({
            path: file.fileName,
            size: file.size,
            original_name: file.clientName,
            extension: file.subtype,
          });

          const transformedImage = await transform.item(image, Transformer);

          images.push(transformedImage);

          return response.status(201).send({successes: images, errors: {}});
        }

        return response.status(400).send({
          message: 'Error on image upload!',
        });
      }

      let files = await manage_multiple_uploads(fileJar);

      await Promise.all(
        files.successes.map(async file => {
          const image = await Image.create({
            path: file.fileName,
            size: file.size,
            original_name: file.clientName,
            extension: file.subtype,
          });

          const transformedImage = await transform.item(image, Transformer);

          images.push(transformedImage);
        }),
      );

      return response
        .status(201)
        .send({successes: images, errors: files.errors});
    } catch (error) {
      return response.status(400).send({
        message: 'Error on images upload!',
      });
    }
  }

  /**
   * Display a single image.
   * GET images/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show({params: {id}, request, response, view, transform}) {
    let image = await Image.findOrFail(id);
    image = transform.item(image, Transformer);

    return response.send(image);
  }

  /**
   * Update image details.
   * PUT or PATCH images/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update({params, request, response}) {}

  /**
   * Delete a image with id.
   * DELETE images/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy({params, request, response}) {}
}

module.exports = ImageController;
