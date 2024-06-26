const path = require(`path`);
const slugify = require("slugify");
const { createFilePath } = require(`gatsby-source-filesystem`);
const { paginate } = require("gatsby-awesome-pagination");

exports.onCreateNode = ({ node, getNode, actions }) => {
  const { createNodeField } = actions;

  if (node.internal.type === `MarkdownRemark`) {
    const parent = getNode(node.parent);
    let collection = parent.sourceInstanceName;
    let prepend = "";
    if (collection === "blog") {
      prepend = "/article";
    }
    const value = prepend + createFilePath({ node, getNode });
    createNodeField({
      name: `slug`,
      node,
      value,
    });
    createNodeField({
      node,
      name: "collection",
      value: collection,
    });
  }
};

exports.createPages = async ({ graphql, actions, reporter }) => {
  const { createPage } = actions;

  const pageTemplate = require.resolve(`./src/templates/page.tsx`);

  const pageresults = await graphql(`
    {
      Pages: allMarkdownRemark(
        filter: { fields: { collection: { eq: "pagesrc" } } }
      ) {
        nodes {
          fields {
            slug
          }
        }
      }
    }
  `);

  if (pageresults.errors) {
    reporter.panicOnBuild(`Error while running Pages GraphQL query.`);
    return;
  }

  pageresults.data.Pages.nodes.forEach(page => {
    createPage({
      path: page.fields.slug,
      component: pageTemplate,
      context: {
        slug: page.fields.slug,
      },
    });
  });

  const blogPostTemplate = require.resolve(`./src/templates/blog-post.tsx`);

  const blogresults = await graphql(`
    {
      blogPosts: allMarkdownRemark(
        sort: { frontmatter: { date: DESC } }
        filter: { fields: { collection: { eq: "blog" } } }
        limit: 1000
      ) {
        nodes {
          fields {
            slug
          }
          frontmatter {
            tags
          }
        }
      }
    }
  `);

  if (blogresults.errors) {
    reporter.panicOnBuild(`Error while running Blog Post GraphQL query.`);
    return;
  }

  let posts = blogresults.data.blogPosts.nodes;
  posts.forEach(post => {
    createPage({
      path: post.fields.slug,
      component: blogPostTemplate,
      context: {
        slug: post.fields.slug,
      },
    });
  });

  paginate({
    createPage,
    items: posts,
    itemsPerPage: 20,
    pathPrefix: ({ pageNumber, numberOfPages }) =>
      pageNumber === 0 ? "/blog" : "/blog/page",
    component: path.resolve("src/templates/blog-index.tsx"),
  });

  const tagresults = await graphql(`
    query MyQuery {
      blogTags: allMarkdownRemark(
        filter: { fields: { collection: { eq: "blog" } } }
      ) {
        distinct(field: { frontmatter: { tags: SELECT } })
      }
    }
  `);

  if (tagresults.errors) {
    reporter.panicOnBuild(`Error while running Tags GraphQL query.`);
    return;
  }

  let tags = tagresults.data.blogTags.distinct;
  let tagSlug = "";
  tags.forEach(tag => {
    tagSlug = slugify(tag, { lower: true, remove: /[^\w\s$*_+~.()'"!\-@]+/g });
    paginate({
      createPage,
      items: posts.filter(post => {
        if (post.frontmatter.tags != undefined) {
          if (post.frontmatter.tags.includes(tag)) {
            return post;
          }
        }
      }),
      itemsPerPage: 20,
      pathPrefix: ({ pageNumber, numberOfPages }) =>
        pageNumber === 0 ? "/blog/tag/" + tagSlug : "/blog/tag/" + tagSlug + "/page",
      component: path.resolve("src/templates/tag.tsx"),
      context: { tag: tag },
    });
  });

  // *** Begin Omega Addon Page Builds
  const omegaaddonresults = await graphql(`
    query MyQuery {
      allOmegaAddon {
        nodes {
          slug
        }
      }
    }
  `);

  if (omegaaddonresults.errors) {
    reporter.panicOnBuild(`Error while running Omega Add-on GraphQL query.`);
    return;
  }

  omegaaddonresults.data.allOmegaAddon.nodes.forEach(addon => {
    createPage({
      path: "addons/omega/" + addon.slug,
      component: path.resolve(`src/templates/omega/addon.tsx`),
      context: {
        slug: addon.slug,
      },
    });
  });

  const omegacategoryresults = await graphql(`
    query MyQuery {
      allOmegaCategory {
        nodes {
          slug
        }
      }
    }
  `);

  if (omegacategoryresults.errors) {
    reporter.panicOnBuild(
      `Error while running Omega Add-on Category GraphQL query.`,
    );
    return;
  }

  omegacategoryresults.data.allOmegaCategory.nodes.forEach(category => {
    createPage({
      path: "addons/omega/category/" + category.slug,
      component: path.resolve(`src/templates/omega/category.tsx`),
      context: {
        slug: category.slug,
      },
    });
  });

  const omegaauthorresults = await graphql(`
    query MyQuery {
      allOmegaAuthor {
        nodes {
          slug
        }
      }
    }
  `);

  if (omegaauthorresults.errors) {
    reporter.panicOnBuild(`Error while running Omega Add-on Author GraphQL query.`);
    return;
  }

  omegaauthorresults.data.allOmegaAuthor.nodes.forEach(author => {
    createPage({
      path: "addons/omega/author/" + author.slug,
      component: path.resolve(`src/templates/omega/author.tsx`),
      context: {
        slug: author.slug,
      },
    });
  });
  // *** End Omega Addon Page Builds

  const distresults = await graphql(`
    query MyQuery {
      allDistributionYaml {
        nodes {
          name
        }
      }
    }
  `);

  if (distresults.errors) {
    reporter.panicOnBuild(`Error while running Distributions GraphQL query.`);
    return;
  }

  distresults.data.allDistributionYaml.nodes.forEach(dist => {
    createPage({
      path:
        "download/" +
        slugify(dist.name, { lower: true, remove: /[^\w\s$*_+~.()'"!\-@]+/g }),
      component: path.resolve(`src/templates/distribution.tsx`),
      context: {
        name: dist.name,
      },
    });
  });
};
